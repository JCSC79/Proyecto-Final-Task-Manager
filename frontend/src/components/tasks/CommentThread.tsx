import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import { Button, Intent, Spinner, TextArea } from '@blueprintjs/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getComments, postComment, type IComment } from '../../api/comment.api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { AppToaster } from '../../utils/toaster';
import styles from './CommentThread.module.css';

interface Props {
  taskId: string;
}

/** Deterministic color from a string — same name always gets same color */
function avatarColor(seed: string): string {
  const palette = [
    '#2980b9', '#27ae60', '#e67e22', '#8e44ad',
    '#c0392b', '#16a085', '#d35400', '#2c3e50',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (seed.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

/** Returns up to 2 initials from a display name or email */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Avatar component — shows photo if available, initials otherwise */
const CommentAvatar: React.FC<{
  name: string;
  avatarUrl?: string | null;
  bgColor: string;
}> = ({ name, avatarUrl, bgColor }) => {
  const [imgFailed, setImgFailed] = React.useState(false);
  const showImg = !!avatarUrl && !imgFailed;

  return (
    <div
      className={styles.avatar}
      style={!showImg ? { backgroundColor: bgColor } : undefined}
      aria-hidden="true"
    >
      {showImg
        ? <img
            src={avatarUrl}
            alt=""
            className={styles.avatarImg}
            onError={() => setImgFailed(true)}
          />
        : initials(name)}
    </div>
  );
};

export const CommentThread: React.FC<Props> = ({ taskId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const bottomRef = useRef<HTMLLIElement>(null);

  const { data: comments = [], isLoading } = useQuery<IComment[]>({
    queryKey: ['comments', taskId],
    queryFn: () => getComments(taskId),
    staleTime: 0,
  });

  // Scroll to latest message — instant on first load, smooth on new arrivals
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  // On initial load: scroll instantly to bottom once data arrives
  useEffect(() => {
    if (!isLoading && comments.length > 0) {
      scrollToBottom('instant');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // On new message arrival: smooth scroll
  useEffect(() => {
    if (comments.length > 0) {
      scrollToBottom('smooth');
    }
  }, [comments.length, scrollToBottom]);

  const mutation = useMutation({
    mutationFn: (text: string) => postComment(taskId, text),
    onSuccess: (newComment) => {
      queryClient.setQueryData<IComment[]>(['comments', taskId], (prev = []) =>
        prev.some(c => c.id === newComment.id) ? prev : [...prev, newComment]
      );
      setBody('');
    },
    onError: () => {
      AppToaster.show({ message: t('commentError'), intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }
    mutation.mutate(trimmed);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? body.length;
      const end = textarea.selectionEnd ?? body.length;
      const newBody = body.slice(0, start) + emojiData.emoji + body.slice(end);
      setBody(newBody);
      // Restore focus and cursor position after insertion
      requestAnimationFrame(() => {
        textarea.focus();
        const pos = start + emojiData.emoji.length;
        textarea.setSelectionRange(pos, pos);
      });
    } else {
      setBody(prev => prev + emojiData.emoji);
    }
    setShowPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) {
      return '';
    }
    return new Date(iso).toLocaleString(undefined, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className={styles.loading}><Spinner size={20} /></div>;
    }
    if (comments.length === 0) {
      return <p className={styles.empty}>{t('noComments')}</p>;
    }

    return (
      <ul className={styles.list} ref={listRef}>
        {comments.map(comment => {
          const isOwn = comment.userId === user?.id;
          const displayName = isOwn
            ? (user?.name ?? user?.email ?? 'You')
            : (comment.authorName ?? comment.authorEmail ?? '?');
          const avatarSeed = comment.authorEmail ?? comment.userId;
          const bgColor = avatarColor(avatarSeed);

          const avatarUrl = isOwn ? (user?.avatar_url ?? null) : (comment.authorAvatarUrl ?? null);

          return (
            <li key={comment.id} className={`${styles.bubble} ${isOwn ? styles.own : styles.other}`}>
              <CommentAvatar name={displayName} avatarUrl={avatarUrl} bgColor={bgColor} />
              <div className={styles.bubbleContent}>
                <div className={styles.meta}>
                  <span className={styles.author}>
                    {isOwn ? t('you') : displayName}
                  </span>
                  <span className={styles.time}>{formatTime(comment.createdAt)}</span>
                </div>
                {/* ReactMarkdown renders **bold**, _italic_, `code`, lists, etc. */}
                <div className={styles.body}>
                  <ReactMarkdown
                    allowedElements={['p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'a']}
                    unwrapDisallowed
                  >
                    {comment.body}
                  </ReactMarkdown>
                </div>
              </div>
            </li>
          );
        })}
        <li ref={bottomRef} aria-hidden="true" style={{ height: 1 }} />
      </ul>
    );
  };

  return (
    <div className={styles.thread}>
      {renderContent()}

      <div className={styles.inputWrapper}>
        {showPicker && (
          <div className={styles.pickerContainer}>
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={isDark ? Theme.DARK : Theme.LIGHT}
              width="100%"
              height={340}
              searchDisabled={false}
              lazyLoadEmojis
            />
          </div>
        )}
        <div className={styles.inputRow}>
          <Button
            icon="emoji"
            variant="minimal"
            onClick={() => setShowPicker(p => !p)}
            aria-label="Emoji"
            title="Emoji"
            className={showPicker ? styles.emojiActive : ''}
          />
          <TextArea
            inputRef={textareaRef}
            className={styles.textarea}
            placeholder={t('commentPlaceholder')}
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            maxLength={1000}
            aria-label={t('commentPlaceholder')}
          />
          <Button
            intent={Intent.PRIMARY}
            icon="send-message"
            loading={mutation.isPending}
            disabled={!body.trim()}
            onClick={handleSend}
            aria-label={t('commentSend')}
            title={t('commentSend')}
          />
        </div>
      </div>
    </div>
  );
};
