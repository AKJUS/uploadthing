import { type Metadata } from "next";
import { getAllArticles } from "@/lib/articles";

import { ArticlesPage } from "../../_components/articles-page";

export const metadata: Metadata = {
  title: "Articles",
  description: "UploadThing blog posts",
};

export async function generateStaticParams() {
  const { allTags } = await getAllArticles();
  return allTags.map((tag) => ({ category: tag }));
}

export default async function ArticlesIndex(
  props: Readonly<{
    params: Promise<{ category: string }>;
  }>,
) {
  const { category } = await props.params;
  return <ArticlesPage tag={category} />;
}
