"use client";

import { useState, useEffect } from "react";
import { Send, Trash2, MessageSquare } from "lucide-react";
import { getComments, createComment, deleteComment } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import type { Comment } from "@/types/database";
import { cn } from "@/lib/utils";

interface CommentListProps {
  taskId: string;
}

export function CommentList({ taskId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  const loadComments = async () => {
    const data = await getComments(taskId);
    setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSending) return;

    setIsSending(true);
    const comment = await createComment(taskId, newComment.trim());

    if (comment) {
      setComments([...comments, comment]);
      setNewComment("");
    }
    setIsSending(false);
  };

  const handleDelete = async (commentId: string) => {
    const success = await deleteComment(commentId);
    if (success) {
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Gerade eben";
    if (diffMins < 60) return `Vor ${diffMins} Min.`;
    if (diffHours < 24) return `Vor ${diffHours} Std.`;
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;
    
    return date.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getInitials = (comment: Comment) => {
    if (comment.user?.full_name) {
      return comment.user.full_name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return comment.user?.email?.charAt(0).toUpperCase() || "?";
  };

  if (loading) {
    return (
      <div className="py-4">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4" />
        Kommentare
        {comments.length > 0 && (
          <span className="text-text-muted">({comments.length})</span>
        )}
      </h3>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary-surface text-primary text-xs font-medium flex items-center justify-center flex-shrink-0">
                {getInitials(comment)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-text-primary">
                    {comment.user?.full_name || comment.user?.email?.split("@")[0] || "Unbekannt"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatDate(comment.created_at)}
                  </span>
                  {comment.user_id === currentUserId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-error-light text-text-muted hover:text-error transition-all ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted mb-4">Noch keine Kommentare</p>
      )}

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Kommentar schreiben..."
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:border-primary outline-none"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSending}
          className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}