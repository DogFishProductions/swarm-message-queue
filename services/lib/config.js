const Config = module.exports = {}
Config.NodeEnv = process.env.NODE_ENV

// general settings
const GeneralSettings = {
  'logLevel': 'error',
  'webHost': {
    'protocol': 'http',
    'domain': 'localhost',
    'port': 3000,
    'apiPathPrefix': '/api/v1'
  }
}

Object.assign(Config, GeneralSettings)

const ServiceDomain = (Config.NodeEnv === 'user-bridge' ? 'zerobridge' : 'localhost')

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
      'processes': 3,
      'timeout': 10000,
      'listenPort': 5678
    },
    'requester': {
      'module': 'requester.js',
      'connection': {
        'protocol': 'tcp',
        'domain': ServiceDomain,
        'port': 5432
      },
      'timeout': 10000
    },
    'responderManager': {
      'handler': 'responder'
    },
    'responderCluster': {
      'module': 'responderCluster.js',
      'handler': 'responder',
      'processes': 1,
      'router': {
        'connection': {
          'protocol': 'tcp',
          'domain': ServiceDomain,
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
        'protocol': 'tcp',
        'domain': ServiceDomain,
        'port': 5432
      }
    },
    'socket': {
      'module': 'socket.js',
      'connection': {
        'port': 5678,
        'host': ServiceDomain
      }
    },
    'fileReader': {
      'module': 'fileReader.js',
      'filename': 'target.txt',
      'minelay': 2000,
      'maxDelay': 2000
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
