import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/seo";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useListNews } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = ["All", "Industry News", "Company", "Regulatory", "Operations"];

export default function News() {
  const [category, setCategory] = useState("All");

  const { data, isLoading } = useListNews(
    { limit: 24, ...(category !== "All" ? { category } : {}) },
    { query: { queryKey: ["news", "list", category] } }
  );

  const articles = data?.data ?? [];

  return (
    <div>
      <Helmet>
        <title>News & Industry Updates | Sinovera Transit Global</title>
        <meta name="description" content="Stay up to date with the latest international freight news, trade regulation changes, and Sinovera Transit Global company announcements." />
        <meta property="og:title" content="News & Updates — Sinovera Transit Global" />
        <meta property="og:description" content="Latest freight industry news, trade regulations, and company announcements from STG." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/news`} />
        <link rel="canonical" href={`${SITE_URL}/news`} />
      </Helmet>
      {/* Hero */}
      <div className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-secondary/20 text-secondary border-secondary/40 mb-4">News & Updates</Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Industry News & Announcements</h1>
            <p className="text-white/70 text-lg">
              Stay up to date with the latest in international freight, trade regulations, and company news.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="py-16 bg-[#f8fafc]">
        <div className="container mx-auto px-4">
          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? "bg-primary text-white"
                    : "bg-white border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
                data-testid={`filter-${cat.toLowerCase().replace(/\s/g, "-")}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Articles */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-primary/20 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary mb-2">No articles found</h3>
              <p className="text-muted-foreground text-sm">Check back soon for the latest news.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, i) => (
                <motion.div
                  key={article.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/news/${article.slug}`} data-testid={`link-article-${article.slug}`}>
                    <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer h-full flex flex-col">
                      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a6e] h-44 flex items-center justify-center">
                        <Package className="w-16 h-16 text-[#f5a623]/40" />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        {article.category && (
                          <Badge variant="outline" className="self-start mb-2 text-xs">{article.category}</Badge>
                        )}
                        <h2 className="font-bold text-primary mb-2 line-clamp-2">{article.title}</h2>
                        <p className="text-muted-foreground text-sm line-clamp-3 flex-1">
                          {article.excerpt ?? article.content?.slice(0, 150)}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {article.publishedAt ? format(new Date(article.publishedAt), "MMM d, yyyy") : ""}
                          </span>
                          <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                            Read more <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
