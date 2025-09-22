import winston from 'winston'
import path from 'path'

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
  })
)

export const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'mail-miner.log'),
      level: 'info'
    }),
    new winston.transports.File({
      filename: path.join('logs', 'mail-miner-error.log'),
      level: 'error'
    }),
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  ]
})

export default logger