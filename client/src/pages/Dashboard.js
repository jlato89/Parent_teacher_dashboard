import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import setAuthToken from '../utils/setAuthToken';
import jwt_decode from 'jwt-decode';
import Layout from '../components/Layout/Layout';
import Announcements from '../components/Announcement/Announcement';
import MenuBtn from '../components/MenuBtn/MenuBtn';
import Logo from '../components/Logo/Logo';
import styles from './Dashboard.module.css';

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      redirect: false,
      loading: true,
      user: {},
      eventArr: [],
      studentArr: [],
      reportArr: []
    };
  }

  async componentDidMount() {
    //? Check for token in localStorage, if true set default headers
    const token = localStorage.getItem('ptDash');
    if (token) {
      setAuthToken(token);
      const decode = jwt_decode(token);
      await this.setState({
        user: {
          id: decode.id,
          userType: decode.userType
        }
      });
    }

    //? Check if parent, if true grab students associated with the user ID
    let findStudent = '/findStudent';
    if (this.state.user.userType === 'parent') {
      console.log('User is parent');
      findStudent = `/findStudent/${this.state.user.id}`;
    }

    //? Run all calls for info that needs to be retrieved.
    axios
      .all([
        axios.get('/findUser'),
        axios.get('/findEvent'),
        axios.get(findStudent)
      ])
      .then(
        axios.spread((userData, eventData, studentData) => {
          console.log('User:', userData.data.user);
          console.log('Events:', eventData.data);
          console.log('Students:', studentData.data);
          this.setState({
            user: userData.data.user,
            eventArr: eventData.data,
            studentArr: studentData.data,
            loading: false
          });
        })
      )
      .catch(err => console.log(err.response));
  }

  handleLogout = () => {
    localStorage.removeItem('ptDash');
    this.setState({ redirect: true });
  };

  render() {
    const { redirect, user } = this.state;
    let dashboardContent;

    //? Pull announcements from state.eventArr
    const announcements = this.state.eventArr.filter(event => {
      return event.isAnnouncement === true;
    });

    //? Redirect to homepage if logout
    if (redirect) {
      return <Redirect to='/' />;
    }

    //? Content to render when app is loading
    if (this.state.loading) {
      dashboardContent = (
        <div className={styles.container}>
          <h2>Loading...</h2>
          <Logo />
        </div>
      );
    }
    //? Main content to render once app is finished loading
    else {
      dashboardContent = (
        <>
          <Layout 
            profileImg={user.profileImage} 
            name={user.firstName}>
            <Announcements announcements={announcements} />
            <MenuBtn name='Create Report' link='/reports/create' />
            {/* <MenuBtn name='Students' link='/students' /> */}
          </Layout>
            <button onClick={this.handleLogout}>Logout</button>
            <br />
            <a href='/reports/create'>Create Report WIP</a>
        </>
      );
    }

    return <div className='dashboardPage'>{dashboardContent}</div>;
  }
}

export default Dashboard;
