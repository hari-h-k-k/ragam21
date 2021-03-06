import React, { useEffect, useState, useCallback } from "react";
import Header from "../../Components/Header/Header";
import {
  Upload,
  message,
  Button,
  Form,
  Card,
  Modal,
  UploadProps,
  Divider,
} from "antd";
import useFitText from "use-fit-text";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useParams, useHistory } from "react-router-dom";
import Team from "../../Components/Team/Team";
import axios from "axios";
import {
  EventDetailsType,
  PropTypes,
  RegEventDetail,
  backendURI,
} from "../../data";
import {
  UploadOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { UploadFile } from "antd/lib/upload/interface";
interface ParamTypes {
  eId: string;
}
interface MyRegProps extends PropTypes {
  getUserEvents: () => void;
}

var j = 0;
function getDefaultfileList(listArr: RegEventDetail["submissions"]) {
  let myArr = [];
  if (listArr)
    for (let i in listArr) {
      myArr.push({
        uid: listArr[i].id.toString(),
        name: listArr[i].name,
        url: backendURI.slice(0, -1) + listArr[i].url,
        size: listArr[i].size,
        type: listArr[i].mime,
      });
    }
  return myArr;
}
export default function MyRegistationPage(props: MyRegProps) {
  let { eId } = useParams<ParamTypes>();
  dayjs.extend(relativeTime);
  type SizeType = Parameters<typeof Form>[0]["size"];
  const [userEvent, setUserEvent] = useState<RegEventDetail>();
  const [eventDetails, setEventDetails] = useState<EventDetailsType>();
  const [loading, setLoading] = useState(true);
  const [ValidEId, setVaildEid] = useState({
    isValid: false,
    eventId: 0,
    catId: 0,
    inCatId: 0,
    userEventId: -1,
  });
  const [visibleModal, setVisibleModal] = useState(false);
  const [removePromise, setRemovePromise] = useState<any>();
  const [fileX, setfileX] = useState<UploadFile>();
  function handleRemove(file: UploadFile) {
    setVisibleModal(true);
    setfileX(file);

    return new Promise<boolean>((resolve, reject) => {
      setRemovePromise({ resolve, reject });
    });
  }

  function unregisterfromEvent() {
    if (!userEvent) return;
    let myLocalTeam = [];

    for (let xi in userEvent.teamMembers) {
      if (userEvent.teamMembers[xi].id != props.user.id)
        myLocalTeam.push(userEvent.teamMembers[xi]);
    }
    if (myLocalTeam.length > 0) {
      fetch(backendURI + "user-event-details/" + userEvent.id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + props.user.token,
        },
        body: JSON.stringify({
          teamMembers: myLocalTeam,
          submissions: userEvent.submissions,
        }),
      })
        .then((res) => res.json())
        .then(
          (result) => {
            //verify the result
            console.log(result);
            if (result.statuscode == 400) {
              message.error(result.message);
            } else {
              props.getUserEvents();
              message.success("Unregistered successfully!!");
              history.goBack();
            }
            console.log(result);
          },
          (error) => {
            console.log(error);
            message.error("Some error occured Please try again");
          }
        );
    } else {
      fetch(backendURI + "user-event-details/" + userEvent.id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + props.user.token,
        },
      })
        .then((res) => res.json())
        .then(
          (result) => {
            //verify the result
            console.log(result);
            if (result.statuscode == 400) {
              message.error(result.message);
            } else {
              props.getUserEvents();
              message.success("Unregistered successfully!!");
              history.goBack();
            }
            console.log(result);
          },
          (error) => {
            console.log(error);
            message.error("Some error occurred Please try again");
          }
        );
    }
  }
  // Modal
  const handleOkModalRemove = useCallback(() => {
    if (!userEvent || !fileX) return; //shoud=ld never happer!!

    let mySubs = [];

    for (let i in userEvent.submissions) {
      if (userEvent.submissions[i].id != parseInt(fileX.uid, 10)) {
        mySubs.push(userEvent.submissions[i]);
      }
    }
    //show loading here !!!!!!!!!!!
    fetch(backendURI + "user-event-details/" + userEvent.id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + props.user.token,
      },
      body: JSON.stringify({
        submissions: mySubs,
      }),
    })
      .then((res) => res.json())
      .then(
        (result) => {
          //verify the result
          console.log(result);
          if (result.statuscode == 400) {
            message.error(result.message);

            setVisibleModal(false);
          } else {
            message.success("file " + fileX.name + " removed successfully.");

            setVisibleModal(false);
            if (removePromise && removePromise.resolve) {
              removePromise.resolve(true);
            }
          }
          console.log(result);
        },
        (error) => {
          console.log(error);
          message.error("Some Error occurred Please try again");
        }
      );
  }, [removePromise]);
  const handleCancelModalRemove = useCallback(() => {
    if (removePromise && removePromise.resolve) {
      removePromise.resolve(false);
    }
    setVisibleModal(false);
  }, [removePromise]);

  const [fileList, setFileList] = useState<any[]>([]);
  function handleChange(info: any) {
    if (info.file.status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  }
  const uploadImage = async (options: any) => {
    if (!userEvent) return;
    const { onSuccess, onError, file, onProgress } = options;

    const fmData = new FormData();
    const config = {
      headers: {
        Authorization: "Bearer " + props.user.token,
      },
      onUploadProgress: (event: any) => {
        const percent = Math.floor((event.loaded / event.total) * 100);

        onProgress({ percent: percent });
      },
    };
    fmData.append("refId", userEvent.id.toString());
    fmData.append("files", file);
    console.log(file);
    try {
      const res = await axios.post(backendURI + "upload", fmData, config);

      onSuccess("Ok");
      console.log("server res: ", res);
    } catch (err) {
      console.log("Eroor: ", err);
      const error = new Error("Some error");
      onError({ err });
    }
  };
  function getUserEvent(userEventId: number) {
    console.log("fetching userEventDetail" + userEventId);
    fetch(backendURI + "user-event-details/" + userEventId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + props.user.token,
      },
    })
      .then((res) => res.json())
      .then(
        (result) => {
          //verify the result
          setLoading(false);
          setUserEvent(result);
          console.log(result);
        },
        (error) => {
          console.log(error);
          message.error("Some Error occurred Please try again");
        }
      );
  }
  useEffect(() => {
    console.log("I am useEffect");
    let myValidEvent = {
      isValid: false,
      eventId: 0,
      catId: 0,
      inCatId: 0,
      userEventId: -1,
    };
    for (let i = 0; i < props.categories.length; i++) {
      for (let j = 0; j < props.categories[i].events.length; j++) {
        if (props.categories[i].events[j].slug == eId) {
          const myObj = {
            isValid: true,
            eventId: props.categories[i].events[j].id,
            catId: i,
            inCatId: j,
            userEventId: -1,
          };
          myValidEvent = myObj;
          break;
        }
      }
    }
    if (myValidEvent.isValid) {
      for (let i in props.userDetails.eventDetails) {
        if (props.userDetails.eventDetails[i].event == myValidEvent.eventId) {
          myValidEvent.userEventId = props.userDetails.eventDetails[i].id;
        }
      }
    }
    setVaildEid(myValidEvent);
    if (myValidEvent.userEventId == -1) setLoading(false);
    else {
      console.log("UseEffect Else");
      setEventDetails(
        props.categories[myValidEvent.catId].events[myValidEvent.inCatId]
      );
      getUserEvent(myValidEvent.userEventId);
    }
  }, [props.categories, props.userDetails]);
  function unregisterConfirm() {
    Modal.confirm({
      title: "Are you sure you want to unregister?",
      icon: <ExclamationCircleOutlined />,
      content: (
        <p>
          {" "}
          if your team has more than one member, they will still be registered.
          and they can add you to the team later. Otherwise you will lose your
          submissions
        </p>
      ),
      okText: "OK",
      cancelText: "Cancel",
      onOk: unregisterfromEvent,
    });
  }

  const { fontSize, ref } = useFitText({ maxFontSize: 500, minFontSize: 100 });
  const history = useHistory();
  return (
    <div>
      <Header
        mainText={eventDetails ? eventDetails.name : "Loading..."}
        showBack={true}
        dashimg={backendURI.slice(0, -1) + eventDetails?.coverImage?.url}
        user={props.user}
      />
      {loading ? (
        <div>Loading..</div>
      ) : ValidEId.userEventId == -1 ? (
        <div> Please Make sure that you are registered for this event </div>
      ) : (
        userEvent && (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <h3>
                Registration Status : <b>{userEvent.status}</b>{" "}
              </h3>

              {(eventDetails?.metaTitles?.length || eventDetails?.isTeamEvent) &&<Card
              id="myreg_meta_teammates_card"
                style={{
                  width: "800px",
                  maxWidth: "95%",
                  margin: "auto",
                  marginTop: "25px",
                }}
              >
                {eventDetails?.metaTitles?.map((val, index) => {
                  return (
                    <div key={val}>
                      <br />
                      <h3 style={{ fontWeight: "bold" }}> {val} </h3>
                      <h4>
                        {userEvent.metaValues
                          ? userEvent.metaValues[index]
                          : "NOT AVAILABLE!!"}
                      </h4>
                    </div>
                  );
                })}
                <Divider />
                {eventDetails?.isTeamEvent && (
                  <Team
                    minTeamSize={eventDetails.minTeamSize}
                    maxTeamSize={eventDetails.maxTeamSize}
                    token={props.user.token}
                    userEvent={userEvent}
                    setUserEvent={setUserEvent}
                    uId={props.user.id}
                    getUserEvents={props.getUserEvents}
                  />
                )}
              </Card>}
              {eventDetails?.isSubmissionEvent && (
                <Card
                id="myreg_submissioncard"
                  style={{
                    width: "800px",
                    maxWidth: "95%",
                    margin: "auto",
                    marginTop: "25px",
                  }}
                >
                  {eventDetails &&
                  dayjs(eventDetails.submissionDate).diff(dayjs()) < 0 ? (
                    <div>Submission has Ended!</div>
                  ) : (
                    <div>
                      {"Submission Ends in " +
                        dayjs(eventDetails?.submissionDate).to(dayjs(), true)}
                    </div>
                  )}

                  {eventDetails?.isSubmissionEvent &&
                    dayjs(eventDetails.submissionDate).diff(dayjs()) > 0 && (
                      <div>
                        <Modal
                          title="Delete file"
                          visible={visibleModal}
                          onOk={handleOkModalRemove}
                          onCancel={handleCancelModalRemove}
                        >
                          <p>Are you sure you want to remove this file? </p>
                        </Modal>
                        <Upload.Dragger
                        id="myreg_upload_component"
                          style={{ marginTop: "15px" }}
                          customRequest={uploadImage}
                          onChange={handleChange}
                          listType="picture"
                          className="upload-list-inline"
                          progress={{ showInfo: true }}
                          defaultFileList={getDefaultfileList(
                            userEvent.submissions
                          )}
                          onRemove={(file: UploadFile) => handleRemove(file)}
                          multiple={true}
                        >
                          <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                          </p>
                          <p className="ant-upload-text">
                            Click / Drag and Drop to Upload
                          </p>
                        </Upload.Dragger>
                      </div>
                    )}
                </Card>
              )}
              {eventDetails && (
                <Button
                  id="myreg_unregister"
                  danger
                  type="primary"
                  style={{ marginTop: "15px" }}
                  onClick={() => {
                    unregisterConfirm();
                  }}
                >
                  Unregister from Event
                </Button>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
