const { json } = require('micro');

const MongoClient = require('mongodb').MongoClient;
// paste the MongoDB database connection uri
const MONGODB_URI = '';
let cachedIdeas = null;

module.exports = async req => {

  if (!cachedIdeas) {
    const client = await MongoClient.connect(MONGODB_URI);
    const docs = await client.db('ideas').collection('idea_rus').find({}).toArray();
    cachedIdeas = docs.map(d => d.Text);
  }

  const { request, session, version } = await json(req);

  const utterances = [
    'вдохнови',
    'вдохнови меня',
    'вдохновить',
    'вдохновить меня',
    'идея',
    'идею'
  ];
  let responseText = 'Привет! Скажи вдохнови меня и я дам тебе новую идею!';

  let isIdeaUtterance = false;

  if (utterances.some(u => request.command.includes(u))) {
    const ideaIdx = Math.floor(Math.random() * cachedIdeas.length);
    responseText = cachedIdeas[ideaIdx];
  }
  return {
    version,
    session,
    response: {
      text: responseText,
      end_session: false,
    },
  };
};