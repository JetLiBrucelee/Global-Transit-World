import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/seo";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetNewsArticle, useListNews } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Package, ArrowRight, Calendar, User } from "lucide-react";
import { format } from "date-fns";

export default function NewsArticle() {
  const [, params] = useRoute("/news/:slug");
  const slug = params?.slug ?? "";

  const { data: article, isLoading, isError } = useGetNewsArticle(slug, {
    query: { queryKey: ["news", slug], enabled: !!slug },
  });

  const { data: relatedData } = useListNews(
    { limit: 3 },
    { query: { queryKey: ["news", "related"] } }
  );
  const related = (relatedData?.data ?? []).filter(a => a.slug !== slug).slice(0, 3);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-5 w-1/2 mb-8" />
        <Skeleton className="h-[300px] w-full mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-2xl">
        <h1 className="text-2xl font-bold text-primary mb-4">Article Not Found</h1>
        <Link href="/news"><Button variant="outline"><ChevronLeft className="w-4 h-4 mr-2" /> Back to News</Button></Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Helmet>
        <title>{article.title} | Sinovera Transit Global</title>
        <meta name="description" content={article.excerpt ?? article.content?.slice(0, 160) ?? `Read about ${article.title} on the Sinovera Transit Global news portal.`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt ?? article.content?.slice(0, 160) ?? ''} />
        <meta property="og:type" content="article" />
        {article.publishedAt && <meta property="article:published_time" content={article.publishedAt} />}
        <meta property="og:url" content={`${SITE_URL}/news/${slug}`} />
        <link rel="canonical" href={`${SITE_URL}/news/${slug}`} />
      </Helmet>
      {/* Header */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link href="/news" className="inline-flex items-center text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to News
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {article.category && (
              <Badge className="bg-secondary/20 text-secondary border-secondary/40 mb-4">{article.category}</Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-5 text-white/60 text-sm">
              {article.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(article.publishedAt), "MMMM d, yyyy")}
                </span>
              )}
              {article.category && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" /> {article.category}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Article body */}
          <div className="md:col-span-2">
            <Card className="p-8">
              {article.excerpt && (
                <p className="text-lg text-muted-foreground leading-relaxed mb-6 font-medium border-l-4 border-secondary pl-4">
                  {article.excerpt}
                </p>
              )}
              <div
                className="prose prose-slate max-w-none text-foreground prose-headings:text-primary prose-a:text-secondary"
                dangerouslySetInnerHTML={{ __html: article.content?.replace(/\n/g, "<br />") ?? "" }}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {related.length > 0 && (
              <Card className="p-5">
                <h3 className="font-bold text-primary mb-4">Related Articles</h3>
                <div className="space-y-4">
                  {related.map(rel => (
                    <Link key={rel.slug} href={`/news/${rel.slug}`} className="block group">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded bg-primary/5 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-primary/30" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary group-hover:text-secondary transition-colors line-clamp-2">{rel.title}</p>
                          {rel.publishedAt && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(rel.publishedAt), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/news" className="mt-4 text-xs font-semibold text-secondary flex items-center gap-1 hover:underline">
                  All articles <ArrowRight className="w-3 h-3" />
                </Link>
              </Card>
            )}

            <Card className="p-5 bg-primary text-white border-primary">
              <h3 className="font-bold mb-2">Ready to Ship?</h3>
              <p className="text-white/70 text-sm mb-4">
                Get a competitive freight quote from our logistics experts.
              </p>
              <Link href="/quote" className="block">
                <Button className="w-full bg-secondary text-primary font-bold hover:bg-secondary/90">
                  Request a Quote
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
