import './styles.less';

import React from 'react';

import { Anchor } from 'platform/components';
import Comment from '../Comment';
import { returnDispatchers } from 'app/components/Comment/dispatchers';
import QUARANTINE_BADGE from 'app/components/QuarantineBadge';

export default function CommentPreview(props) {
  const { comment, userActivityPage, commentDispatchers, user,
          commentReplying, editing, editPending } = props;

  return (
    <div className={ `CommentPreview ${userActivityPage ? 'in-list' : 'separated'}` } >
      <div className='CommentPreview__wrapper'>
        { userActivityPage && comment.quarantine
          ? QUARANTINE_BADGE
          : null }
        <Anchor className='CommentPreview__permalink' href={ comment.cleanPermalink }>
          { comment.linkTitle }
        </Anchor>
        <Comment
          comment={ comment }
          isUserActivityPage={ userActivityPage }
          preview={ true }
          isTopLevel={ false }
          user={ user }
          commentReplying={ commentReplying }
          editing={ editing }
          editPending={ editPending }
          { ...returnDispatchers(commentDispatchers, comment.name) }
        />
      </div>
    </div>
  );
}
