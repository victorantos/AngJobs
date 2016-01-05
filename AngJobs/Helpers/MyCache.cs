using Angjobs.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Caching;
using System.Web;
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

            if (((List<JobPostViewModel>)CacheItem).Any())
                cache.Set(CacheKeyName, CacheItem, policy);

            policy.ChangeMonitors.Add(new HostFileChangeMonitor(FilePath));
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

 
}