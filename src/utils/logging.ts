import loggerFactory, { configure } from 'log4js';
import userContext from './UserContext';
import config from '../config';

const loggerConfig: any = process.env.LOGGER_CONFIG ?
  JSON.parse(process.env.LOGGER_CONFIG) :
  {
    disableClustering: true,
    appenders: {
      out: { type: 'stdout', layout: { type: 'pattern', pattern: '%[ [%d] [%p] %] %c - %x{correlationId} - %m' } }
    },
    categories: { default: { appenders: ['out'], level: process.env.NODE_ENV === 'test' ? 'fatal' : config.logLevel } }
  };
if (loggerConfig && loggerConfig.appenders && loggerConfig.appenders.out && loggerConfig.appenders.out.layout) {
  if (!loggerConfig.appenders.out.layout.tokens) loggerConfig.appenders.out.layout.tokens = {};
  loggerConfig.appenders.out.layout.tokens.correlationId = (logEvent: any) => {
    return userContext.getCorrelationId();
  };
}
configure(loggerConfig);
export default loggerFactory;
