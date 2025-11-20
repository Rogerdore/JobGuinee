import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = "https://emploi-guinee.gn";
    const urls: SitemapUrl[] = [];

    urls.push({
      loc: `${baseUrl}/`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "daily",
      priority: "1.0",
    });

    urls.push({
      loc: `${baseUrl}/jobs`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "hourly",
      priority: "0.9",
    });

    urls.push({
      loc: `${baseUrl}/formations`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "daily",
      priority: "0.8",
    });

    urls.push({
      loc: `${baseUrl}/blog`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "daily",
      priority: "0.8",
    });

    urls.push({
      loc: `${baseUrl}/cvtheque`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "daily",
      priority: "0.7",
    });

    urls.push({
      loc: `${baseUrl}/resources`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "weekly",
      priority: "0.7",
    });

    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, created_at, updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (jobs) {
      jobs.forEach((job) => {
        urls.push({
          loc: `${baseUrl}/jobs/${job.id}`,
          lastmod: job.updated_at || job.created_at,
          changefreq: "weekly",
          priority: "0.8",
        });
      });
    }

    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("id, created_at, updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(500);

    if (blogPosts) {
      blogPosts.forEach((post) => {
        urls.push({
          loc: `${baseUrl}/blog/${post.id}`,
          lastmod: post.updated_at || post.created_at,
          changefreq: "monthly",
          priority: "0.6",
        });
      });
    }

    const { data: formations } = await supabase
      .from("formations")
      .select("id, created_at, updated_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(500);

    if (formations) {
      formations.forEach((formation) => {
        urls.push({
          loc: `${baseUrl}/formations/${formation.id}`,
          lastmod: formation.updated_at || formation.created_at,
          changefreq: "monthly",
          priority: "0.6",
        });
      });
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
