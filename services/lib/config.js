const Config = module.exports = {}
Config.NodeEnv = process.env.NODE_ENV
Config.FileName = process.env.FILE_NAME || 'target.txt'

// general settings
const GeneralSettings = {
  'logLevel': 'debug',
  'webHost': {
    'protocol': 'http',
    'domain': 'localhost',
    'port': 3000,
    'apiPathPrefix': '/api/v1'
  }
}

Object.assign(Config, GeneralSettings)

const ServerDomain = (Config.NodeEnv === 'user-bridge' ? 'requester' : '127.0.0.1')
const RequesterDomain = (Config.NodeEnv === 'user-bridge' ? 'responder' : '127.0.0.1')

// To change the handler for a service, simply reset the 'handler' value to the desired service key.
// For custom services (i.e. those written for this app) it is necessary for the service key to match
// the filename of the module defining that service.
const Services = {
  'services': {
    'requesterManager': {
      'handler': 'requesterCluster'
    },
    'requesterCluster': {
      'module': 'requesterCluster.js',
      'handler': 'requester',
      'server': 'socketServer',
      'processes': 3,
      'timeout': 10000,
      'listenPort': 5678
    },
    'requester': {
      'module': 'requester.js',
      'connection': {
        'protocol': 'tcp',
        'domain': RequesterDomain,
        'port': 5432
      },
      'timeout': 10000
    },
    'responderManager': {
      'handler': 'responderCluster'
    },
    'responderCluster': {
      'module': 'responderCluster.js',
      'handler': 'responder',
      'processes': 3,
      'router': {
        'connection': {
          'protocol': 'tcp',
          'domain': '*',
          'port': 5432
        }
      },
      'dealer': {
        'connection': {
          'protocol': 'ipc',
          'domain': 'filer-dealer.ipc'
        }
      }
    },
    'responder': {
      'module': 'responder.js',
      'handler': 'fileReader',
      'connection': {
        'protocol': 'ipc',
        'domain': 'filer-dealer.ipc'
      }
    },
    'socket': {
      'module': 'socket.js',
      'connection': {
        'port': 5678,
        'host': ServerDomain
      }
    },
    'fileReader': {
      'module': 'fileReader.js',
      'filename': Config.FileName,
      'minDelay': 1000,
      'maxDelay': 3000
    },
    'socketServer': {
      'module': 'net'
    }
  }
}
Object.assign(Config, Services)

// Define the endpoints to be added to the API.
const ApiEndpoints = {
  'apiEndpoints': {
    'dispatcher': {
      'module': 'dispatcher.js',
      'handlers': [
        {
          'service': 'socket',
          'function': 'makeRequest',
          'path': '/dispatcher/request',
          'method': 'get'
        },
        {
          'service': 'socket',
          'function': 'connect',
          'path': '/dispatcher/connect',
          'method': 'get'
        }
      ]
    }
  }
}
Object.assign(Config, ApiEndpoints)
