/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');

const MongoClient = require('mongodb').MongoClient;
const MONGODB_URI = process.env.MONGODB_URI;
let cachedIdeas = null;

const LaunchHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechOutput = 'Welcome to Idea box! You can say inspire me and I will give you a fresh new idea!'
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(HELP_MESSAGE)
      .withSimpleCard(SKILL_NAME, speechOutput)
      .getResponse();
  },
};

const GetNewIdeaHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'GetNewIdeaIntent';
  },
  handle(handlerInput) {
    const speechOutput = getRandomIdea() + '. Would you like another idea?';
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(HELP_MESSAGE)
      .withSimpleCard(SKILL_NAME, speechOutput)
      .getResponse();
  },
};

const getRandomIdea = () => {
  const ideaIdx = Math.floor(Math.random() * cachedIdeas.length);
  return cachedIdeas[ideaIdx];
}

const NoHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.NoIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .getResponse();
  },
};

const SKILL_NAME = 'Idea';
const HELP_MESSAGE = 'You can say tell me an idea, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

let skill;

exports.handler = async function (event, context) {
  if (!cachedIdeas) {
    const client = await MongoClient.connect(MONGODB_URI);
    const docs = await client.db('ideas').collection('idea').find({}).toArray();
    cachedIdeas = docs.map(d => d.Text);
  }

  if (!skill) {
    skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(
        LaunchHandler,
        GetNewIdeaHandler,
        NoHandler,
        HelpHandler,
        ExitHandler,
        SessionEndedRequestHandler
      )
      .addErrorHandlers(ErrorHandler)
      .create();
  }

  return await skill.invoke(event, context);
};
