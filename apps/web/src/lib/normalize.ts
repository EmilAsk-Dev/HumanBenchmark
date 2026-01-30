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

        comments: buildCommentTree(
            (apiPost.comments ?? []).map((c: any): Comment => ({
                id: String(c.id),
                user: c.user ?? apiPost.user,
                content: c.text ?? c.content ?? "",
                createdAt: new Date(c.createdAt),
                likes: Number(c.likes ?? 0),
                isLiked: Boolean(c.isLiked ?? false),
                parentCommentId: c.parentCommentId != null ? String(c.parentCommentId) : null,
                replies: [],
            }))
        ),
    };
}

export function normalizePosts(apiPosts: any[]): Post[] {
    return (apiPosts ?? []).map(normalizePost);
}

export function buildCommentTree(comments: Comment[]): Comment[] {
    if (!comments?.length) return [];

    // If API already returns nested replies, just return it
    const alreadyNested = comments.some(c => Array.isArray(c.replies) && c.replies.length > 0);
    if (alreadyNested) return comments;

    const byId = new Map<string, Comment>();
    const roots: Comment[] = [];

    // clone + init replies
    for (const c of comments) {
        byId.set(c.id, { ...c, replies: [] });
    }

    for (const c of byId.values()) {
        const parentId = c.parentCommentId ?? null;
        if (!parentId) {
            roots.push(c);
            continue;
        }

        const parent = byId.get(parentId);
        if (!parent) {
            // orphan => treat as root to avoid losing it
            roots.push(c);
            continue;
        }

        parent.replies!.push(c);
    }

    // Optional: sort by time (newest first) for roots + replies
    const sortNewestFirst = (a: Comment, b: Comment) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    const sortTree = (nodes: Comment[]) => {
        nodes.sort(sortNewestFirst);
        for (const n of nodes) sortTree(n.replies ?? []);
    };

    sortTree(roots);
    return roots;
}

export function normalizeComment(apiComment: any, fallbackUser?: any): Comment {
    const user = apiComment?.user ?? fallbackUser;

    return {
        id: String(apiComment?.id),
        user: {
            ...user,
            avatar: user?.avatar ?? "/avatar-placeholder.png",
            username: user?.username ?? "unknown",
            displayName: user?.displayName ?? "Unknown",
        },
        content: apiComment?.text ?? apiComment?.content ?? "",
        createdAt: new Date(apiComment?.createdAt ?? Date.now()),
        likes: Number(apiComment?.likes ?? 0),
        isLiked: Boolean(apiComment?.isLiked ?? false),

        parentCommentId: apiComment?.parentCommentId ? String(apiComment.parentCommentId) : null,
        replies: (apiComment?.replies ?? []) as Comment[], // (if API returns nested)
    };
}
