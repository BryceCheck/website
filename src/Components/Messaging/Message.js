import { useState } from 'react';
import { OUTBOUND_MSG } from '../../consts';
import { DateTime } from 'luxon';

import './Message.css';

const Message = (props) => {
  const [showInfo, setShowInfo] = useState(false);

  const isOutbound = props.msg.style === OUTBOUND_MSG;
  const label = <div className='msg-author-label'>{props.msg.author}</div>;
  const style = isOutbound ? 'msg-container right-adjusted' : 'msg-container';
  const infoStyle = isOutbound ? 'msg-info-container right-adjusted' : 'msg-info-container';
  const timestampStyle = isOutbound ? 'msg-info-label right-text' : 'msg-info-label';
  const ts = DateTime.fromJSDate(props.msg.timestamp).toLocal().toRFC2822()

  var contentDiv;
  if (props.msg.type === 'media') {
    contentDiv = <img onClick={e => setShowInfo(!showInfo)} src={props.msg.url} alt='Media Message Format not allwed' key={props.msg.key} className={props.msg.style + ' media-message'} ref={props.lastElementRef}/>;
  } else {
    contentDiv = <div onClick={e => setShowInfo(!showInfo)} className={props.msg.style} key={props.msg.key} ref={props.lastElementRef}>{props.msg.body}</div>;
  }

  return (
    <div className={infoStyle}>
      <div className={style}>
        {isOutbound
          ? <>{label}{contentDiv}</>
          : <>{contentDiv}{label}</>
        }
      </div>
      <div className={timestampStyle} style={{ display: showInfo ? 'block' : 'none'}}>
        {ts.substring(0, ts.length-9)}
      </div>
    </div>
  );
}

export default Message;