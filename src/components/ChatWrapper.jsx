import { useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import Chat from "./Chat";

const ChatWrapper = () => {
  const { groupId } = useParams();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  return <Chat groupId={groupId} userId={userId} />;
};

export default ChatWrapper;
