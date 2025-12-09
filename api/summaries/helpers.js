const emptyDefault = {
  trank: {},
  xrank: {},
  socialrank: {},
};

async function getLatestChannelSummaries(db, channelIds = []) {
  if (!Array.isArray(channelIds) || channelIds.length === 0)
    return emptyDefault;

  const res = await db.query(
    `
    SELECT DISTINCT ON (channel_id)
      id,
      channel_id,
      topic,
      few_words,
      one_sentence,
      error,
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

async function getLatestSocialSummaries(db, channelIds = []) {
  if (!Array.isArray(channelIds) || channelIds.length === 0)
    return emptyDefault;

  const res = await db.query(
    `
    SELECT DISTINCT ON (channel_id)
      id,
      channel_id,
      topic,
      few_words,
      one_sentence,
      error,
      created_at
    FROM socialrank.channel_summaries
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
      topic,
      few_words,
      one_sentence,
      error,
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
  const [trank, xrank, socialrank] = await Promise.all([
    getLatestChannelSummaries(db, ids),
    getLatestCommunitySummaries(db, ids),
    getLatestSocialSummaries(db, ids),
  ]);
  return { trank, xrank, socialrank };
}
