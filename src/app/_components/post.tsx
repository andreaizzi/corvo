"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setName("");
    },
  });

  return (
    <div style={{width: '100%', maxWidth: '20rem'}}>
      {latestPost ? (
        <p style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>Your most recent post: {latestPost.name}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ name });
        }}
        style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}
      >
        <input
          type="text"
          placeholder="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{width: '100%', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', color: 'white', border: 'none', outline: 'none'}}
        />
        <button
          type="submit"
          style={{borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.75rem 2.5rem', fontWeight: '600', border: 'none', color: 'white', cursor: 'pointer', transition: 'background-color 0.2s'}}
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}