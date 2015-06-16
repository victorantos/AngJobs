using Angjobs.Sitemap;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Xml.Linq;

namespace Angjobs.Controllers
{
    public class Sitemap_F92C179D37124DCDA570B3D65B1BE533Controller : Controller
    {
        // GET: Sitemap_F92C179D37124DCDA570B3D65B1BE533
        string timeZone = "+00:00";
        string secretCode = "27naj15";

        public ActionResult Index()
        {
            var rootPath = Server.MapPath("~/");
            var sitemapPath = Path.Combine(rootPath, "sitemap", "sitemap-"+ secretCode+".xml");

            var sitemap = CreateSitemap(sitemapPath);

            return View(new { mainSitemap = sitemap, totalSitemaps = 1}.ToExpando());
        }

        private object CreateSitemap(string sitemapPath)
        {
            var website = "http://angjobs.com/";

            var links = new List<string> { 
              "#!/jobs/inbox",
              "#!/jobs/permanent",
              "#!/jobs/contract",
              "#!/daily",
              "#!/!/jobs/contract/london",
              "#!/jobs/contract/us",
              "#!/about",
              
              "#!/employer", 
              "#!/postjob",
              "help"
            };
            for (int i = 0; i < links.Count; i++)
                links[i] = links[i].Insert(0, website);

            var turls = new List<tUrl>();
            foreach (var item in links)
            {
                turls.Add(new tUrl
                {
                    changefreq = tChangeFreq.weekly,
                    // TODO only the last accounts sitemap might be modified on file regeneration, and not all of them
                    lastmod = DateTime.UtcNow.ToString("s") + timeZone,
                    loc = item,
                    priority = new Decimal(0.8)
                });
            }

            SaveSitemap(turls, sitemapPath);

            return turls.Count;
        }

        private void SaveSitemap(List<tUrl> turls, string fileName)
        {
            var fi = new FileInfo(fileName);
            if (!fi.Directory.Exists)
                Directory.CreateDirectory(fi.Directory.FullName);
            XNamespace nsSitemap = "http://www.sitemaps.org/schemas/sitemap/0.9";
            var xdoc = new XDocument(new XElement(nsSitemap + "urlset",
                from link in turls
                select new XElement(nsSitemap + "url",
                        new XElement(nsSitemap + "loc", link.loc),
                          new XElement(nsSitemap + "lastmod", link.lastmod),
                            new XElement(nsSitemap + "changefreq", link.changefreq),
                               new XElement(nsSitemap + "priority", link.priority) 
                    ))
            );
            xdoc.Save(fileName);
        }

    }
}