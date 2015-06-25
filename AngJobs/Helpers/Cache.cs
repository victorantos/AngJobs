 using System; 
using System.Collections.Generic; 
using System.Linq; 
using System.Text; 
using System.Runtime.Caching;
using Angjobs.Models;
using System.Data.Entity;
using System.Collections.Specialized;
using System.Web;
using Microsoft.AspNet.Identity.Owin;
using System.Collections;

namespace Angjobs
{
    public enum MyCachePriority
    {
        Default,
        NotRemovable
    }

    public class MyCache
    {
        // Gets a reference to the default MemoryCache instance. 
        private static ObjectCache cache = MemoryCache.Default;
        private CacheItemPolicy policy = null;
        private CacheEntryRemovedCallback callback = null;

       
        public void AddToMyCache(String CacheKeyName, Object CacheItem, MyCachePriority MyCacheItemPriority, List<String> FilePath)
        {
            callback = new CacheEntryRemovedCallback(this.MyCachedItemRemovedCallback);
            policy = new CacheItemPolicy();
            policy.Priority = (MyCacheItemPriority == MyCachePriority.Default) ? CacheItemPriority.Default : CacheItemPriority.NotRemovable;
            policy.AbsoluteExpiration = DateTimeOffset.Now.AddSeconds(86400.00);
            policy.RemovedCallback = callback;
            policy.ChangeMonitors.Add(new HostFileChangeMonitor(FilePath));

            // Add inside cache 
            cache.Set(CacheKeyName, CacheItem, policy);
        }

        public Object GetMyCachedItem(String CacheKeyName)
        {
            return cache[CacheKeyName] as Object;
        }

        public void RemoveMyCachedItem(String CacheKeyName)
        {
            if (cache.Contains(CacheKeyName))
            {
                cache.Remove(CacheKeyName);
            }
        }

        private void MyCachedItemRemovedCallback(CacheEntryRemovedArguments arguments)
        {
            // Log these values from arguments list 
            String strLog = String.Concat("Reason: ", arguments.RemovedReason.ToString(), " | Key-Name: ", arguments.CacheItem.Key, " | Value-Object: ", arguments.CacheItem.Value.ToString());
        }

        public JobPostViewModel FindBy(int jobPostId)
        {
            return JobsCacheManager.ListJobPosts.SingleOrDefault(x => x.id == jobPostId);
        }
    }

 
    public static class JobsCacheManager
    {
        const string listJobPostsShortDescriptionStr = "ListJobPostsShortDescription";
        const string listDailyJobPostsShortDescriptionStr = "ListDailyJobPostsShortDescription";
        const string listHotJobPostsShortDescriptionStr = "ListHotJobPostsShortDescription";
        const string listJobPostsStr = "ListJobPosts";
        const string listRecruiterJobPosts = "ListRecruiterJobPosts";
        const string listRecruiterDailyJobApplications = "ListRecruiterDailyJobApplications";
        const string listJobPostsFromHN = "ListJobPostsFromHN";



        const int maxJobs = 115;
        static int maxHotJobs = 10;
        static int maxRecruitersToCache = 5;

        private static MemoryCache _cache = MemoryCache.Default;
        private static DBContext db =  HttpContext.Current.GetOwinContext().Get<DBContext>();

        public static List<JobPostViewModel> ListJobPosts
        {
            get
            {
                if (!_cache.Contains("ListJobPosts"))
                    RefreshListJobPosts();
                return _cache.Get("ListJobPosts") as List<JobPostViewModel>;
            }
        }
        public static List<JobPostViewModel> ListJobPostsShortDescription
        {
            get
            {
                if (!_cache.Contains(listJobPostsShortDescriptionStr))
                    RefreshListJobPosts(listJobPostsShortDescriptionStr);
                return _cache.Get(listJobPostsShortDescriptionStr) as List<JobPostViewModel>;
            }
        }
        public static OrderedDictionary ListDailyJobPostsShortDescription
        {
            get
            {
                if (!_cache.Contains(listDailyJobPostsShortDescriptionStr))
                    RefreshListJobPosts(listDailyJobPostsShortDescriptionStr);
                return _cache.Get(listDailyJobPostsShortDescriptionStr) as OrderedDictionary;
            }
        }
        public static IEnumerable<JobPostViewModel> ListHotJobPostsShortDescription
        {
            get
            {
                if (!_cache.Contains(listHotJobPostsShortDescriptionStr))
                    RefreshListJobPosts(listHotJobPostsShortDescriptionStr);
                return _cache.Get(listHotJobPostsShortDescriptionStr) as IEnumerable<JobPostViewModel>;
            }
        }
        public static Queue<RecruiterJobPosts> ListRecruiterJobPosts
        {
            get
            {
                if (!_cache.Contains(listRecruiterJobPosts))
                    RefreshListJobPosts(listRecruiterJobPosts);
                return _cache.Get(listRecruiterJobPosts) as Queue<RecruiterJobPosts>;
            }
        }
        public static Queue<RecruiterDailyJobApplications> ListRecruiterDailyJobApplications
        {
            get
            {
                if (!_cache.Contains(listRecruiterDailyJobApplications))
                    RefreshListJobPosts(listRecruiterDailyJobApplications);
                return _cache.Get(listRecruiterDailyJobApplications) as Queue<RecruiterDailyJobApplications>;
            }
        }

        public static void RefreshListJobPosts()
        {
            var list = GetAllJobPosts();

            CacheItemPolicy cacheItemPolicy = new CacheItemPolicy();
            cacheItemPolicy.AbsoluteExpiration = DateTime.Now.AddDays(1);

            //check again before adding it
            if (!_cache.Contains(listJobPostsStr))
                _cache.Add(listJobPostsStr, list, cacheItemPolicy);
        }

        public static void RefreshListJobPosts(string cacheKey)
        {
            DBContext db = new DBContext();
            object list = null;
                switch (cacheKey)
                {
                    case listJobPostsShortDescriptionStr:
                        list = Helpers.GetAllJobPostsShortDescription(db, maxJobs);
                        break;
                    case listDailyJobPostsShortDescriptionStr:
                        list = GetDailyJobPostsShortDescription();
                        break;
                    case listHotJobPostsShortDescriptionStr:
                        list = GetHotJobPostsShortDescription(maxHotJobs);
                        break;
                    case listRecruiterJobPosts:
                        list = new Queue<RecruiterJobPosts>(maxRecruitersToCache); 
                        break;
                    case listRecruiterDailyJobApplications:
                        list = new Queue<RecruiterDailyJobApplications>(maxRecruitersToCache);
                        break;
                    case listJobPostsFromHN:
                        list = Helpers.GetAllJobPostsFromHN(db, maxJobs);
                        break;
                    default:
                        break;
                }

            var cacheItemPolicy = new CacheItemPolicy();
            cacheItemPolicy.AbsoluteExpiration = DateTime.Now.AddDays(1);
            
            _cache.Add(cacheKey, list, cacheItemPolicy);
        }

        public class RecruiterJobPosts
        {
            public string Id {get;set;}
            public IEnumerable<JobPostViewModel> Jobs{get;set;}
        }
        public class RecruiterDailyJobApplications
        {
            public string Id {get;set;}
            public OrderedDictionary Jobs { get; set; }
        }

        private static object GetHotJobPostsShortDescription(int maxHotJobs)
        {
            var hotList = ListJobPostsShortDescription.Where(j => j.isHot.HasValue && j.isHot.Value).Take(maxHotJobs);
            if (hotList.Count() == 0)
                hotList = ListJobPostsShortDescription.Take(maxHotJobs);

            return hotList;
        }
         
        private static object GetDailyJobPostsShortDescription()
        {
            var q = from j in db.JobPosts
                    let dt = DbFunctions.TruncateTime(j.SourcePostedDate)
                    where (!j.IsDeleted.HasValue || !j.IsDeleted.Value) && !j.SourceReference.Contains("news.ycomb")
                    group j by dt into g
                    select new
                    {
                        jobs = g.ToList(),
                        day = g.Key
                    };
            var orderedList = new OrderedDictionary();
            var allJobs = q.Where(j=>j.day.HasValue).ToList();
            
            //take just half of list, it's too long
           var list = allJobs.Skip(allJobs.Count()/2).ToDictionary(g => g.day, g => g.jobs.Select(j => new JobPostViewModel(j)).ToList());

            foreach (var item in list.Keys.ToList().OrderByDescending(k=>k.Value))
	        {
                  foreach (var i in list[item])
                   i.shortDescription = i.jobDescription =null;
		        
                orderedList.Add(item.Value, list[item]);
            }

            return orderedList;
        }

        public static OrderedDictionary GetDailyJobApplications(string recruiterId)
        {
            var q = from j in db.JobApplications
                    let dt = DbFunctions.TruncateTime(j.DateCreated)
                    where (!j.IsDeleted.HasValue || !j.IsDeleted.Value) 
                            && !string.IsNullOrEmpty(recruiterId) 
                            && j.JobPost.CreatedBy == recruiterId 
                    group j by dt into g
                    select new
                    {
                        jobApplications = g.ToList(),
                        day = g.Key
                    };
            var orderedList = new OrderedDictionary();
            var list = q.Where(j => j.day.HasValue).ToDictionary(g => g.day, g => g.jobApplications.Select(j => new EmployersJobApplicationsViewModel(j)).ToList());

            foreach (var item in list.Keys.ToList().OrderByDescending(k => k.Value))
                orderedList.Add(item.Value, list[item]);

            return orderedList;
        }

        private static object GetAllJobPosts()
        {
            return db.JobPosts.Where(j => !j.IsDeleted.HasValue || !j.IsDeleted.Value).OrderByDescending(j => j.SourcePostedDate).ToList().Select(j => new JobPostViewModel(j)).Take(maxJobs).ToList();
        }

        public static List<JobPostViewModel> ListJobPostsFromHN
        {
            get
            {
                if (!_cache.Contains(listJobPostsFromHN))
                    RefreshListJobPosts(listJobPostsFromHN);
                return _cache.Get(listJobPostsFromHN) as List<JobPostViewModel>;
            }
        }
    }
}