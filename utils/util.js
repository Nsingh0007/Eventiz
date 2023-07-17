import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { toast } from "react-toastify";
import {
  getDownloadURL,
  ref,
  uploadString,
  deleteObject,
} from "@firebase/storage";
import db, { storage, auth } from "./firebase";
import emailjs from "@emailjs/browser";

import {
  getDoc,
  addDoc,
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  deleteDoc,
  where,
  arrayUnion,
} from "@firebase/firestore";

const sendEmail = (
  name,
  email,
  title,
  time,
  date,
  note,
  description,
  passcode,
  flier_url,
  setSuccess,
  setLoading
) => {
  emailjs
    .send(
      process.env.NEXT_PUBLIC_SERVICE_ID,
      process.env.NEXT_PUBLIC_TEMPLATE_ID,
      {
        name,
        email,
        title,
        time: convertTo12HourFormat(time),
        date,
        note,
        description,
        passcode,
        flier_url,
      },
      process.env.NEXT_PUBLIC_API_KEY
    )
    .then(
      (result) => {
        setLoading(false);
        setSuccess(true);
      },
      (error) => {
        alert(error.text);
      }
    );
};

export const generateID = () => Math.random().toString(36).substring(2, 10);

export const createSlug = (sentence) => {
  let slug = sentence.toLowerCase().trim();
  slug = slug.replace(/[^a-z0-9]+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");
  return slug;
};

export const addEventToFirebase = async (
  id,
  title,
  date,
  time,
  venue,
  description,
  note,
  flier,
  router
) => {
  const docRef = await addDoc(collection(db, "events"), {
    user_id: id,
    title,
    date,
    time,
    venue,
    description,
    note,
    slug: createSlug(title),
    attendees: [],
    disableRegistration: false,
  });

  const imageRef = ref(storage, `events/${docRef.id}/image`);

  if (flier !== null) {
    await uploadString(imageRef, flier, "data_url").then(async () => {
      //👇🏻 Gets the image URL
      const downloadURL = await getDownloadURL(imageRef);
      //👇🏻 Updates the docRef, by adding the logo URL to the document
      await updateDoc(doc(db, "events", docRef.id), {
        flier_url: downloadURL,
      });

      //Alerts the user that the process was successful
      successMessage("Event created! 🎉");
      router.push("/dashboard");
    });
  } else {
    successMessage("Event created! 🎉");
    router.push("/dashboard");
  }
};

export const successMessage = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};

export const errorMessage = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};

export const firebaseCreateUser = (email, password, router) => {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      successMessage("Account created 🎉");
      router.push("/login");
    })
    .catch((error) => {
      console.error(error);
      errorMessage("Account creation declined ❌");
    });
};

export const firebaseLoginUser = (email, password, router) => {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      successMessage("Authentication successful 🎉");
      router.push("/dashboard");
    })
    .catch((error) => {
      console.error(error);
      errorMessage("Incorrect Email/Password ❌");
    });
};

export const firebaseLogOut = (router) => {
  signOut(auth)
    .then(() => {
      successMessage("Logout successful! 🎉");
      router.push("/");
    })
    .catch((error) => {
      errorMessage("Couldn't sign out ❌");
    });
};

export const getEvents = (id, setEvents, setLoading) => {
  try {
    const q = query(collection(db, "events"), where("user_id", "==", id));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const firebaseEvents = [];
      querySnapshot.forEach((doc) => {
        firebaseEvents.push({ data: doc.data(), id: doc.id });
      });
      setEvents(firebaseEvents);
      setLoading(false);

      return () => unsubscribe();
    });
  } catch (error) {
    console.error(error);
  }
};

export const convertTo12HourFormat = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const hours12 = hours % 12 || 12;
  const formattedTime = `${hours12.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
  return `${formattedTime}${period}`;
};

export const updateRegLink = async (id) => {
  const number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  const eventRef = doc(db, "events", id);
  updateDoc(eventRef, {
    disableRegistration: true,
    slug: `expired-${number}`,
  });
};

export const registerAttendee = async (
  name,
  email,
  event_id,
  setSuccess,
  setLoading
) => {
  setLoading(true);
  const passcode = generateID();
  const eventRef = doc(db, "events", event_id);
  const eventSnap = await getDoc(eventRef);
  let firebaseEvent = {};
  if (eventSnap.exists()) {
    firebaseEvent = eventSnap.data();
    const attendees = firebaseEvent.attendees;
    const result = attendees.filter((item) => item.email === email);
    if (result.length === 0 && firebaseEvent.disableRegistration === false) {
      await updateDoc(eventRef, {
        attendees: arrayUnion({
          name,
          email,
          passcode,
        }),
      });
      const flierURL = firebaseEvent.flier_url
        ? firebaseEvent.flier_url
        : "No flier for this event";
      sendEmail(
        name,
        email,
        firebaseEvent.title,
        firebaseEvent.time,
        firebaseEvent.date,
        firebaseEvent.note,
        firebaseEvent.description,
        "data:image/png;base64,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gtzcLyoZmGCDnI6yKUnQ+36TgzQoyCsRGz1+3r5XgLfvf38+lZV9K3T1AxeQACBoZZwjkAYFv6HptURAb0PT6j83TZUDM54g1H794j/buGLWHnyz0eOfX/z+RC2gnzhtxgO+fpxVkG9lfPbCrEkEfqCOBAAwtcBkqwIV3B4IlSvzL73mMib3AS2QAABNlAjEHRgDf7gjlLfPu4zVPtABCQDQhoK/kgAlA1XuFagCVvtAfCQAQA/cFsHIR2dS7UZHcgR9oD8kAEBMSgZ2HDrb17Q5JNMY9HXCgRI/kBwJANAHVxmwM+d/R89AFnRsUd37rPSBdJEAACmqzaFXz8B5tgoSspMOo0C/8KqJNvAzqAfIBgkAkJHaUJvabXQkBO01BvxeLz8C0D8SACAn2h7QlDtVCfaMns904p3P3KjihUNR0L96Iit8oCAkAECBXJWgNuv+czs1ryqVgsZRxHNnTLI/ttMHadwDvEACAHjIzsU/fn58Pr7e3AU5PnEjhWuXDxkCPVAiJABAybitBNG8/eZZ+44SiPEfdxlvrGDdOPNflwbZ99MmjL+39wLUA/74PQIEeaC0SAAAAAgQ3TcAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAkQCAABAgEgAAAAIEAkAAAABIgEAACBAJAAAAASIBAAAgACRAAAAECASAAAAAvTfAd7leWLT8gsCAAAAAElFTkSuQmCC",
        flierURL,
        setSuccess,
        setLoading
      );
    } else {
      setLoading(false);
      errorMessage("User already registered ❌");
    }
  }
};

export const deleteEvent = async (id) => {
  await deleteDoc(doc(db, "events", id));

  const imageRef = ref(storage, `events/${id}/image`);
  deleteObject(imageRef)
    .then(() => {
      console.log("Deleted successfully");
    })
    .catch((error) => {
      console.error("Image does not exist");
    });
};
