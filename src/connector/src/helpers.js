function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
import { SequenceCrossAppConnector } from './SequenceCrossAppConnector.js';
export const createSequenceCrossAppConnector = (metadata, transportConfig)=>{
    return ()=>[
            class extends SequenceCrossAppConnector {
                constructor(props){
                    super(_extends({}, props, {
                        metadata,
                        transportConfig
                    }));
                }
            }
        ];
};
