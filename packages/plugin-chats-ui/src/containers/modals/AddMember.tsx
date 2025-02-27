import React from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
// erxes
import { Alert } from '@erxes/ui/src/utils';
// local
import Component from '../../components/modals/AddMember';
import { queries, mutations } from '../../graphql';

type Props = {
  chatId: string;
  closeModal: () => void;
};

const AddMemberContainer = (props: Props) => {
  const { chatId } = props;
  const [memberMutation] = useMutation(gql(mutations.chatAddOrRemoveMember));

  const addOrRemoveMember = (userIds: string[]) => {
    if (userIds.length === 0) {
      return Alert.error('Select users!');
    }

    memberMutation({
      variables: { id: chatId, type: 'add', userIds },
      refetchQueries: [{ query: gql(queries.chats) }]
    })
      .then(() => {
        props.closeModal();
      })
      .catch(error => {
        Alert.error(error.message);
      });
  };

  return <Component {...props} addOrRemoveMember={addOrRemoveMember} />;
};

export default AddMemberContainer;
