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
        static int maxHotJobs = 30;
        static int maxRecruitersToCache = 5;

        private static MemoryCache _cache = MemoryCache.Default;
        private static MyCache _myCache = new MyCache();
        private static DBContext db = new DBContext();//  HttpContext.Current.GetOwinContext().Get<DBContext>();

        public static List<JobPostViewModel> ListJobPosts
        {
            get
            {
                if (_myCache.GetMyCachedItem("ListJobPosts") == null)
                    RefreshListJobPosts();
                return _myCache.GetMyCachedItem("ListJobPosts") as List<JobPostViewModel>;
            }
        }
        public static List<JobPostViewModel> ListJobPostsShortDescription
        {
            get
            {
                if (_myCache.GetMyCachedItem(listJobPostsShortDescriptionStr) == null)
                    RefreshListJobPosts(listJobPostsShortDescriptionStr);
                return _myCache.GetMyCachedItem(listJobPostsShortDescriptionStr) as List<JobPostViewModel>;
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
             string cacheKey = listJobPostsStr;

             AddToMyCache(list, cacheKey);
        }

        private static void AddToMyCache(object list, string cacheKey)
        {
            string filePath = HttpContext.Current.Server.MapPath("~/App_Data/Logs/import.txt");

            //check again before adding it
            if (_myCache.GetMyCachedItem(cacheKey) == null)
                _myCache.AddToMyCache(cacheKey, list, MyCachePriority.Default, new List<string> { filePath });
        }

        public static void RefreshListJobPosts(string cacheKey)
        {
            DBContext db = new DBContext();
            object list = null;
                switch (cacheKey)
                {
                    case listJobPostsShortDescriptionStr:
                        list = Helpers.Common.GetAllJobPostsShortDescription(db, maxJobs);
                        AddToMyCache(list, cacheKey);
                        break;
                    case listDailyJobPostsShortDescriptionStr:
                        list = GetDailyJobPostsShortDescription();
                        AddToMemCache(cacheKey, list);
                        break;
                    case listHotJobPostsShortDescriptionStr:
                        list = GetHotJobPostsShortDescription(maxHotJobs);
                        AddToMemCache(cacheKey, list);
                        break;
                    case listRecruiterJobPosts:
                        list = new Queue<RecruiterJobPosts>(maxRecruitersToCache);
                        AddToMemCache(cacheKey, list);
                        break;
                    case listRecruiterDailyJobApplications:
                        list = new Queue<RecruiterDailyJobApplications>(maxRecruitersToCache);
                        AddToMemCache(cacheKey, list);
                        break;
                    case listJobPostsFromHN:
                        list = Helpers.Common.GetAllJobPostsFromHN(db, maxJobs);
                        AddToMemCache(cacheKey, list);
                        break;
                    default:
                        break;
                }

                
        }

        private static void AddToMemCache(string cacheKey, object list)
        {
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

        public static object GetHotJobPostsShortDescription(int? maxHotJobs = 0)
        {
            if (ListJobPostsShortDescription == null)
                return null;
            var hotList = ListJobPostsShortDescription.Where(j => j.isHot.HasValue && j.isHot.Value).Take(maxHotJobs.Value);
            if (hotList.Count() == 0)
                hotList = ListJobPostsShortDescription.Take(maxHotJobs.Value);

            return hotList;
        }

        private static IEnumerable<JobPostViewModel> ListHotJobPostsShortDescription()
        {
                if (!_cache.Contains(listHotJobPostsShortDescriptionStr))
                    RefreshListJobPosts(listHotJobPostsShortDescriptionStr);
                return _cache.Get(listHotJobPostsShortDescriptionStr) as IEnumerable<JobPostViewModel>;
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