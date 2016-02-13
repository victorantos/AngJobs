using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text.RegularExpressions;
using System.Web.Mvc;
using System.Dynamic;
using System.ComponentModel;
using Angjobs.Models;
using System.Security.Cryptography;

namespace Angjobs.Helpers
{
    public static class Common
    {
        public static string GetHash(string input)
        {
            HashAlgorithm hashAlgorithm = new SHA256CryptoServiceProvider();

            byte[] byteValue = System.Text.Encoding.UTF8.GetBytes(input);

            byte[] byteHash = hashAlgorithm.ComputeHash(byteValue);

            return Convert.ToBase64String(byteHash);
        }

        public static string UppercaseFirst(string s)
        {
            // Check for empty string.
            if (string.IsNullOrEmpty(s))
            {
                return string.Empty;
            }
            // Return char and concat substring.
            return char.ToUpper(s[0]) + s.Substring(1);
        }

        public static string EnsureValidUrl(string s)
        {
            // Check for empty string.
            if (string.IsNullOrEmpty(s))
            {
                return string.Empty;
            }
            // Return char and concat substring.
            return s.StartsWith("http://") ? s : "http://" + s;
        }

        public static string ShortenDescription(string description)
        {
            if (string.IsNullOrEmpty(description))
                return string.Empty;

            var desc = description;
            var maxLength = 220;
            if (desc.Length < maxLength)
                maxLength = desc.Length - 7;

            var shortDesc = "";
            if (maxLength > 0 && maxLength < desc.Length)
                shortDesc = desc.Substring(0, maxLength);
            else
                shortDesc = desc;
            return Common.HtmlRemoval.StripTagsCharArray(shortDesc);
        }

        public static ExpandoObject ToExpando(this object anonymousObject)
        {
            IDictionary<string, object> expando = new ExpandoObject();
            foreach (PropertyDescriptor propertyDescriptor in TypeDescriptor.GetProperties(anonymousObject))
            {
                var obj = propertyDescriptor.GetValue(anonymousObject);
                expando.Add(propertyDescriptor.Name, obj);
            }

            return (ExpandoObject)expando;
        }

        public static object GetAllJobPostsShortDescription(DBContext db, int maxJobs)
        {
            var list = db.JobPosts.AsNoTracking().Where(j => (!j.IsDeleted.HasValue || !j.IsDeleted.Value)).ToList().Select(j => new JobPostViewModel(j)).OrderByDescending(j => j.dateCreated).Take(maxJobs).OrderByDescending(j => j.datePosted).OrderByDescending(c => c.priority).ToList();

            foreach (var item in list)
            {
                item.shortDescription = ShortenDescription(item.jobDescription);
                item.jobDescription = null;
            }

            return list.ToList();

        }


        public static object GetAllJobPostsFromHN(DBContext db, int maxJobs)
        {
            var list = db.JobPosts.Where(j => (!j.IsDeleted.HasValue || !j.IsDeleted.Value) && j.SourceReference.Contains("news.ycomb")).ToList()
                .Select(j => new JobPostViewModel(j)).OrderByDescending(j => j.dateCreated).Take(maxJobs).ToList();

            foreach (var item in list)
            {
                item.shortDescription = ShortenDescription(item.jobDescription);
                item.jobDescription = null;
            }

            return list.ToList();
        }

        /// <summary>
        /// Methods to remove HTML from strings.
        /// </summary>
        public static class HtmlRemoval
        {
            /// <summary>
            /// Remove HTML from string with Regex.
            /// </summary>
            public static string StripTagsRegex(string source)
            {
                return Regex.Replace(source, "<.*?>", string.Empty);
            }

            /// <summary>
            /// Compiled regular expression for performance.
            /// </summary>
            static Regex _htmlRegex = new Regex("<.*?>", RegexOptions.Compiled);

            /// <summary>
            /// Remove HTML from string with compiled Regex.
            /// </summary>
            public static string StripTagsRegexCompiled(string source)
            {
                return _htmlRegex.Replace(source, string.Empty);
            }

            /// <summary>
            /// Remove HTML tags from string using char array.
            /// </summary>
            public static string StripTagsCharArray(string source)
            {
                char[] array = new char[source.Length];
                int arrayIndex = 0;
                bool inside = false;

                for (int i = 0; i < source.Length; i++)
                {
                    char let = source[i];
                    if (let == '<')
                    {
                        inside = true;
                        continue;
                    }
                    if (let == '>')
                    {
                        inside = false;
                        continue;
                    }
                    if (!inside)
                    {
                        array[arrayIndex] = let;
                        arrayIndex++;
                    }
                }
                return new string(array, 0, arrayIndex);
            }
        }

    }
}