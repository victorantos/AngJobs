using System.Web;
using System.Web.Optimization;

namespace Angjobs
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {

            bundles.Add(new ScriptBundle("~/bootstrap").Include(
                      "~/bower_components/Bootstrap/dist/js/bootstrap.min.js"));

            //Moved bootstrap css to own style tag in the _layout page.  This is to remove it from the optimizations which was breaking the fonts and icons.
            bundles.Add(new StyleBundle("~/styles").Include(
                "~/Assets/Styles/styles.css"));


            bundles.Add(new ScriptBundle("~/ng").Include(
                        "~/bower_components/angular/angular.min.js",
                        "~/bower_components/angular-cookies/angular-cookies.min.js",
                        "~/bower_components/ng-file-upload/ng-file-upload.min.js"));

            bundles.Add(new ScriptBundle("~/app").IncludeDirectory("~/Assets/app", "*.js", true));

            bundles.Add(new ScriptBundle("~/jquery").Include(
                        "~/Assets/jquery/jquery.min.js"));

            bundles.Add(new ScriptBundle("~/misc").Include(
                "~/Assets/misc/modernizr.min.js",
                "~/Assets/misc/respond.min.js"
                ));

            // Set EnableOptimizations to false for debugging. For more information,
            // visit http://go.microsoft.com/fwlink/?LinkId=301862
#if !DEBUG
             BundleTable.EnableOptimizations = true;
#endif
        }
    }
}
