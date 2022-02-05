const server = require(`@nkmjs/core/server`);

class ServerProcess extends server.core.ServerBase{
    constructor(p_config){super(p_config);}

    _Boot(){
        super._Boot();
    }

}

module.exports = ServerProcess;