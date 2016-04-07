using System;
using System.IO;
using System.Web;
using System.Web.Caching;
using System.Web.Hosting;

public class Fingerprint
{
    public static string Tag(string uri)
    {
        if (HttpRuntime.Cache[uri] == null)
        {
            string path = HostingEnvironment.MapPath("~" + uri);
            DateTime date = File.GetLastWriteTime(path);
            int index = uri.LastIndexOf('/');
            string result = uri.Insert(index, "/v-" + date.Ticks);
            HttpRuntime.Cache.Insert(uri, result, new CacheDependency(path));
        }
        return HttpRuntime.Cache[uri] as string;
    }
}