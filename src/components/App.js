import "../pages/index.css";
import ProtectedRoute from "./ProtectedRoute";
import Header from "./Header";
import Main from "./Main";
import Footer from "./Footer";
import Login from "./Login";
import InfoTooltip from "./InfoTooltip";
import Register from "./Register";
import React, { useState } from "react";
import PopupWithEditProfile from "./PopupWithProfileEdit.js";
import PopupWithEditAvatar from "./PopupWithAvatarEdit.js";
import PopupWithAddPlace from "./PopupWithAddPlace.js";
import ImagePopup from "./ImagePopup.js";
import { currentUserContext } from "../context/CurrentUserContext";
import { api } from "../utils/Api";
import PopupWithConfirm from "./PopupWithConfirm";
import { Route, Switch, useHistory } from "react-router-dom";
import * as auth from "../utils/auth";

export default function App() {
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [isConfirmPopupOpen, setIsConfirmPopupOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [currentCards, setCurrentCards] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [infoTool, setInfoTool] = useState();
  const [sucsess, setSuccsess] = useState(false);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  let history = useHistory();

  React.useEffect(() => {
    Promise.all([api.getData("users/me"), api.getData("cards")])
      .then((data) => {
        const [userData, cardData] = data;
        setCurrentUser(userData);
        setCurrentCards(cardData);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleCardClick = (card) => {
    setIsImagePopupOpen(true);
    setSelectedCard(card);
  };

  const handlePopupConfirmOpen = (card) => {
    setIsConfirmPopupOpen(true);
    setSelectedCard(card);
  };

  const handleCardLike = (card) => {
    const isLiked = card.likes.some((i) => i._id === currentUser._id);
    if (!isLiked) {
      api
        .putLike(card._id)
        .then((newCard) => {
          setCurrentCards((state) =>
            state.map((c) => (c._id === card._id ? newCard : c))
          );
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      api
        .removeLike(card._id)
        .then((newCard) => {
          setCurrentCards((state) =>
            state.map((c) => (c._id === card._id ? newCard : c))
          );
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const handleCardDelete = () => {
    api
      .deleteCard(selectedCard._id)
      .then(() => {
        const newCards = currentCards.filter(
          (item) => item._id !== selectedCard._id
        );
        setCurrentCards(newCards);
        closeAllPopups();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleAddPlaceSubmit = (card) => {
    api
      .addCard(card)
      .then((newCard) => {
        setCurrentCards([newCard, ...currentCards]);
        closeAllPopups();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleEditProfileClick = () => {
    setIsEditProfilePopupOpen(true);
  };

  const handleAddPlaceClick = () => {
    setIsAddPlacePopupOpen(true);
  };

  const handleEditAvatarClick = () => {
    setIsEditAvatarPopupOpen(true);
  };

  const closeAllPopups = () => {
    setIsAddPlacePopupOpen(false);
    setIsEditProfilePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setIsImagePopupOpen(false);
    setIsConfirmPopupOpen(false);
    setInfoTool(false);
    setSelectedCard({});
  };

  const handleUpdateProfile = (data) => {
    api
      .editProfie(data)
      .then((data) => {
        setCurrentUser(data);
        closeAllPopups();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleUpdateAvatar = (data) => {
    api
      .editAvatar(data)
      .then((data) => {
        setCurrentUser(data);
        closeAllPopups();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleRegistration = (password, email) => {
    auth.register(password, email).then((res) => {
      if (res) {
        setSuccsess(true);
        setInfoTool(true);
        setMessage("Вы успешно зарегистрировались!");
        history.push("/sign-in");
      } else {
        setInfoTool(true);
        setSuccsess(false);
        setMessage("Что-то пошло не так! Попробуйте ещё раз.");
      }
    });
  };

  React.useEffect(() => {
    handleCheckToken();
  }, []);

  const handleLogin = (password, email) => {
    auth.login(password, email).then((response) => {
      console.log("auth:", response);
      if (response) {
        localStorage.setItem("jwt", response.token);
        handleCheckToken();
      }
    });
  };

  const handleCheckToken = () => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      auth.checkToken(jwt).then((res) => {
        setUserEmail({
          email: res.data.email,
        });
        setIsLoggedIn(true);
        history.push("/");
      });
    }
  };

  const handleExit = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("jwt");
  };

  return (
    <currentUserContext.Provider value={currentUser}>
      <Header onSignOut={handleExit} userEmail={userEmail} />
      <Switch>
        <ProtectedRoute exact path="/" loggedIn={isLoggedIn}>
          <Main
            onEditProfile={handleEditProfileClick}
            onAddPlace={handleAddPlaceClick}
            onEditAvatar={handleEditAvatarClick}
            onCardClick={handleCardClick}
            cards={currentCards}
            onCardLike={handleCardLike}
            onCardDelete={handlePopupConfirmOpen}
          />
          <Footer />
        </ProtectedRoute>
        <Route path="/sign-in">
          <Login onLogin={handleLogin}></Login>
        </Route>
        <Route path="/sign-up">
          <Register onRegister={handleRegistration}></Register>
        </Route>
      </Switch>
      <PopupWithEditAvatar
        isOpen={isEditAvatarPopupOpen}
        onClose={closeAllPopups}
        onUpdateAvatar={handleUpdateAvatar}
      ></PopupWithEditAvatar>
      <PopupWithEditProfile
        isOpen={isEditProfilePopupOpen}
        onClose={closeAllPopups}
        onUpdateUser={handleUpdateProfile}
      ></PopupWithEditProfile>
      <PopupWithAddPlace
        onAddPlace={handleAddPlaceSubmit}
        isOpen={isAddPlacePopupOpen}
        onClose={closeAllPopups}
      ></PopupWithAddPlace>
      <ImagePopup
        card={selectedCard}
        isOpen={isImagePopupOpen}
        onClose={closeAllPopups}
      ></ImagePopup>
      <PopupWithConfirm
        isOpen={isConfirmPopupOpen}
        onClose={closeAllPopups}
        onSubmit={handleCardDelete}
      ></PopupWithConfirm>
      <InfoTooltip
        isOpen={infoTool}
        onMessage={message}
        onSuccsess={sucsess}
        onClose={closeAllPopups}
      ></InfoTooltip>
    </currentUserContext.Provider>
  );
}
