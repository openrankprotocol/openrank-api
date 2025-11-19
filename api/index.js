module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'https://api.openrank.com';

  res.status(200).json({
    name: 'OpenRank API',
    version: '1.0.0',
    description: 'REST API for OpenRank data across Discord, GitHub, Telegram, and X',
    platforms: [
      {
        name: 'Discord',
        endpoints: [
          `${baseUrl}/api/discord/{file_name}`,
          `${baseUrl}/api/discord/{file_name}/seed`,
          `${baseUrl}/api/discord/{file_name}/server_id`,
          `${baseUrl}/api/discord/{file_name}/scores?start=0&size=10`
        ]
      },
      {
        name: 'GitHub',
        endpoints: [
          `${baseUrl}/api/github/{file_name}`,
          `${baseUrl}/api/github/{file_name}/seed`,
          `${baseUrl}/api/github/{file_name}/ecosystem`,
          `${baseUrl}/api/github/{file_name}/scores?start=0&size=10`
        ]
      },
      {
        name: 'Telegram',
        endpoints: [
          `${baseUrl}/api/telegram/{file_name}`,
          `${baseUrl}/api/telegram/{file_name}/seed`,
          `${baseUrl}/api/telegram/{file_name}/channel_id`,
          `${baseUrl}/api/telegram/{file_name}/scores?start=0&size=10`
        ]
      },
      {
        name: 'X (Twitter)',
        endpoints: [
          `${baseUrl}/api/x/{file_name}`,
          `${baseUrl}/api/x/{file_name}/seed`,
          `${baseUrl}/api/x/{file_name}/community_id`,
          `${baseUrl}/api/x/{file_name}/scores?start=0&size=10`
        ]
      }
    ],
    documentation: `${baseUrl}/`
  });
};
