using System;
using System.IO;
using System.Web;
using System.Web.Caching;
using System.Web.Hosting;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Configuration;

public class Assets
{
    public static Boolean LOCAL = ConfigurationManager.AppSettings.Get("TYPE") == ConfigurationManager.AppSettings.Get("LOCAL");
    public static Boolean STAGING = ConfigurationManager.AppSettings.Get("TYPE") == ConfigurationManager.AppSettings.Get("STAGING");
    public static Boolean PRODUCTION = ConfigurationManager.AppSettings.Get("TYPE") == ConfigurationManager.AppSettings.Get("PRODUCTION");

    public class Bundle
    {
        public static string Fingered(string path, bool fingerprint)
        {
            return fingerprint ? Fingerprint.Tag(path.IndexOf(".") == 0 ? path.Substring(1): path) : path;
        }
        public string format = "{0}";
        public IEnumerable<string> Src;
        public string Folder;
        public string Dist;
        virtual public string Write(bool fingerprint)
        {            
            if (LOCAL)
            {
                return String.Join("\n", Src.Select(x => {
                    return String.Format(format, Fingered(x, fingerprint));
                }).ToArray());
            } else
            {
                if (Dist != null)
                {
                    string name = String.Format("{0}/{1}.min{2}", Path.GetDirectoryName(Dist), Path.GetFileNameWithoutExtension(Dist), Path.GetExtension(Dist));
                    return String.Format(format, Fingered(name, fingerprint));
                } else
                {
                    return String.Empty;
                }
            }
        }
    }
    public class CssBundle : Bundle
    {
        public static string Format = "<link href=\"{0}\" rel=\"stylesheet\" />";
        override public string Write(bool fingerprint)
        {
            format = Format;
            return base.Write(fingerprint);
        }
    }
    public class JsBundle : Bundle
    {
        public static string Format = "<script src=\"{0}\" type=\"text/javascript\"></script>";
        override public string Write(bool fingerprint)
        {
            format = Format;
            return base.Write(fingerprint);
        }        
    }
    public class Bundles
    {
        public IEnumerable<CssBundle> Css;
        public IEnumerable<JsBundle> Js;
    }
    public class Folders
    {
        public string Css;
        public string Js;
    }
    public class Config
    {
        public Folders Folders;
        public Bundles Bundles;
    }

    private static Config _config = null;
    public static Config config
    {
        get
        {
            if (Assets._config == null)
            {
                string path = HttpContext.Current.Server.MapPath(ConfigurationManager.AppSettings.Get("CONFIG"));
                using (StreamReader text = File.OpenText(path))
                {
                    JsonSerializer serializer = new JsonSerializer();
                    Assets._config = (Config)serializer.Deserialize(text, typeof(Config));
                }
            }
            return Assets._config;
        }
    }

    public static string Css(string dist = null, bool fingerprint = true)
    {
        IEnumerable<CssBundle> bundles = Assets.config.Bundles.Css;
        string bundle = string.Join("\n", bundles.Where(x => dist == null || x.Dist == dist).Select(x => x.Write(fingerprint)).ToArray());
        return bundle != string.Empty ? bundle : String.Format(CssBundle.Format, Bundle.Fingered(dist, fingerprint));
    }

    public static string Js(string dist = null, bool fingerprint = true)
    {
        IEnumerable<JsBundle> bundles = Assets.config.Bundles.Js;
        string bundle = string.Join("\n", bundles.Where(x => dist == null || x.Dist == dist).Select(x => x.Write(fingerprint)).ToArray());
        return bundle != string.Empty ? bundle : String.Format(JsBundle.Format, Bundle.Fingered(dist, fingerprint));
    }
}
