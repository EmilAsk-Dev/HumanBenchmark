import type { Post, TestType, Comment } from "@/types";
import { apiTestTypeToTestType } from "@/types";

export function normalizePost(apiPost: any): Post {
    const mapped: TestType | undefined = apiTestTypeToTestType[apiPost?.testRun?.testType];

    return {
        id: String(apiPost.id),
        createdAt: apiPost.createdAt,
        isLiked: Boolean(apiPost.isLiked),
        likeCount: Number(apiPost.likeCount ?? 0),

        user: {
            ...apiPost.user,
            avatar: apiPost.user?.avatar ?? "/avatar-placeholder.png",
        },

        testRun: {
            ...apiPost.testRun,
            testType: mapped ?? "reaction",
            score: Number(apiPost.testRun?.score ?? 0),
            percentile: Number(apiPost.testRun?.percentile ?? 0),
            createdAt: new Date(apiPost.testRun?.createdAt ?? apiPost.createdAt),
        },

        comments: (apiPost.comments ?? []).map((c: any): Comment => ({
            id: String(c.id),
            user: c.user ?? apiPost.user,
            content: c.text ?? c.content ?? "",
            createdAt: new Date(c.createdAt),
            likes: Number(c.likes ?? 0),
        })),
    };
}

export function normalizePosts(apiPosts: any[]): Post[] {
    return (apiPosts ?? []).map(normalizePost);
}
