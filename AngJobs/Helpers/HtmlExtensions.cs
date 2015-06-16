using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.Mvc;

namespace Angjobs.Extensions
{
    public static class HtmlExtensions
    {
        public static bool IsDebug(this HtmlHelper helper)
        {
                #if DEBUG
                                return true;
                #else
                            return false;
                #endif
        }
        
        private static System.Lazy<string> version = new System.Lazy<string>(() =>
        {
            try
            {
                System.Version version = Assembly.GetExecutingAssembly().GetName().Version;
                return String.Format("{0}.{1}.{2}.{3}",
                version.Major,
                version.Minor,
                version.Build,
                version.Revision);
            }
            catch (Exception)
            {
                return null;
            };
        });

        /// 
        /// Returns the Current Version from the AssemblyInfo.cs file.
        /// 
        public static string CurrentVersion(this HtmlHelper helper)
        {
            return version.Value;
        }

    }
}