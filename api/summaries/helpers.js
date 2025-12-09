const emptyDefault = {
  trank: {},
  xrank: {},
};

async function getLatestChannelSummaries(db, channelIds = []) {
  if (!Array.isArray(channelIds) || channelIds.length === 0)
    return emptyDefault;

  const res = await db.query(
    `
    SELECT DISTINCT ON (channel_id)
      id,
      channel_id,
      summary,
      topic,
      few_words,
      one_sentence,
      error,
      model,
      created_at
    FROM trank.channel_summaries
    WHERE channel_id = ANY($1)
    ORDER BY channel_id, created_at DESC
    `,
    [channelIds.slice(0, 100)]
  );

  const rows = res.rows;
  return rows.reduce((acc, curr) => {
    acc[curr.channel_id] = curr;
    return acc;
  }, {});
}

async function getLatestCommunitySummaries(db, communityIds = []) {
  if (!Array.isArray(communityIds) || communityIds.length === 0)
    return emptyDefault;

  const res = await db.query(
    `
    SELECT DISTINCT ON (community_id)
      id,
      community_id,
      summary,
      topic,
      few_words,
      one_sentence,
      error,
      model,
      created_at
    FROM xrank.community_summaries
    WHERE community_id = ANY($1)
    ORDER BY community_id, created_at DESC
    `,
    [communityIds.slice(0, 100)]
  );

  const rows = res.rows;
  return rows.reduce((acc, curr) => {
    acc[curr.community_id] = curr;
    return acc;
  }, {});
}

export async function getSummaries(db, ids = []) {
  const [trank, xrank] = await Promise.all([
    getLatestChannelSummaries(db, ids),
    getLatestCommunitySummaries(db, ids),
  ]);
  return { trank, xrank };
}
