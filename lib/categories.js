import { Share2, DollarSign, Users, Lightbulb } from "lucide-react";

export const CATEGORIES = {
  SHARE: {
    value: "SHARE",
    label: "Share",
    description: "Show off something you built",
    icon: Share2,
    text: "text-category-share",
    bg: "bg-category-share-bg",
    dot: "bg-category-share",
  },
  SELL: {
    value: "SELL",
    label: "Sell",
    description: "Offer a project or service for sale",
    icon: DollarSign,
    text: "text-category-sell",
    bg: "bg-category-sell-bg",
    dot: "bg-category-sell",
  },
  COLLAB: {
    value: "COLLAB",
    label: "Collab",
    description: "Find contributors to build with you",
    icon: Users,
    text: "text-category-collab",
    bg: "bg-category-collab-bg",
    dot: "bg-category-collab",
  },
  IDEA: {
    value: "IDEA",
    label: "Idea",
    description: "Pitch a concept and gauge interest",
    icon: Lightbulb,
    text: "text-category-idea",
    bg: "bg-category-idea-bg",
    dot: "bg-category-idea",
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export function getCategory(value) {
  return CATEGORIES[value] || CATEGORIES.SHARE;
}
