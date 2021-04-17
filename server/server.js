const { GraphQLServer, PubSub } = require("graphql-yoga");

const messages = [];

//PubSub is a subscription handler that will help getting the messages from graphql without the need of polling or refreshing the page

//define schema for the server
//Mutations are like POST

const typeDefs = `
  type Message {
    id: ID!
    user: String!
    content: String!
  }
  type Query {
    messages: [Message!]
  }
  type Mutation {
    postMessage(user: String!, content: String!): ID!
  }
  type Subscription {
    messages: [Message!]
  }
`;

//keep a list of the subscribers;
const subscribers = [];
const onMessagesUpdates = (fn) => subscribers.push(fn);

//resolvers are used to get the data. Match keys with type definition
// postMessage creates an id based on the array length, and push the data to the messages array
const resolvers = {
  Query: {
    messages: () => messages
  },
  Mutation: {
    postMessage: (parent, { user, content }) => {
      const id = messages.length;
      messages.push({
        id,
        user,
        content
      });
      subscribers.forEach((fn) => fn());
      return id;
    }
  },
  Subscription: {
    messages: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random().toString(36).slice(2, 15);
        onMessagesUpdates(() => pubsub.publish(channel, { messages }));
        setTimeout(() => pubsub.publish(channel, { messages }), 0);
        return pubsub.asyncIterator(channel);
      }
    }
  }
};

//Create a server and console.log the port
//Server receives the definitions and resolvers
const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start(({ port }) => {
  console.log(`Server on http://localhost:${port}/`);
});
