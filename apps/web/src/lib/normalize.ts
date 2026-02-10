import type { Post, TestType, Comment, User } from "@/types";
import { apiTestTypeToTestType } from "@/types";


export function normalizePost(apiPost: any): Post {
    const mapped: TestType | undefined = apiTestTypeToTestType[apiPost?.testRun?.testType];

    return {
        id: String(apiPost.id),
        caption: String(apiPost.caption),
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

                user: normalizeUser(c.user, apiPost.user),

                content: c.content ?? c.text ?? "",
                createdAt: new Date(c.createdAt),

                likes: Number(c.likeCount ?? 0),

                isLiked: Boolean(c.isLiked ?? false),

                parentCommentId:
                    c.parentCommentId != null ? String(c.parentCommentId) : null,

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

    const alreadyNested = comments.some(c => Array.isArray(c.replies) && c.replies.length > 0);
    if (alreadyNested) return comments;


    const byId = new Map<string, Comment>();
    const roots: Comment[] = [];

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
            roots.push(c);
            continue;
        }

        parent.replies!.push(c);
    }

    const sortNewestFirst = (a: Comment, b: Comment) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    const sortTree = (nodes: Comment[]) => {
        nodes.sort(sortNewestFirst);
        for (const n of nodes) sortTree(n.replies ?? []);
    };

    sortTree(roots);
    return roots;
}

function normalizeUser(apiUser: any, fallback?: any): User {
    const u = apiUser ?? fallback ?? {};

    const userName =
        u?.userName ??
        u?.username ??
        "unknown";

    const avatarUrl = u?.avatarUrl ?? undefined;
    const avatar = u?.avatar ?? avatarUrl ?? "/avatar-placeholder.png";

    return {
        id: String(u?.id ?? ""),
        userName: String(userName),
        avatarUrl: avatarUrl ? String(avatarUrl) : undefined,
        avatar: String(avatar),
        createdAt: u?.createdAt ?? new Date().toISOString(),
        streak: Number(u?.streakDays ?? u?.streak ?? 0),
        totalSessions: Number(u?.totalSessions ?? 0),
    };
}

export function normalizeComment(apiComment: any, fallbackUser?: any): Comment {
    const user = normalizeUser(apiComment?.user, fallbackUser);

    return {
        id: String(apiComment?.id),
        user,
        content: apiComment?.content ?? apiComment?.text ?? "",
        createdAt: new Date(apiComment?.createdAt ?? Date.now()),
        likes: Number(apiComment?.likeCount ?? apiComment?.likes ?? 0),
        isLiked: Boolean(apiComment?.isLiked ?? false),
        parentCommentId: apiComment?.parentCommentId ? String(apiComment.parentCommentId) : null,
        replies: (apiComment?.replies ?? []).map((r: any) => normalizeComment(r, fallbackUser)),
    };
}
