/* eslint-disable no-console  */
/* eslint-disable no-unused-vars */
import axios from "axios";
import { Constants, Location, Permissions } from "expo";
import React from "react";
import {
  AsyncStorage,
  BackHandler,
  Platform,
  StyleSheet,
  View
} from "react-native";
import { connect, Provider } from "react-redux";
import {
  changeView,
  mapIsReady,
  setDeviceId,
  setInfo,
  setRegion
} from "./app/actions/actions";
import ViewMode from "./app/constants/viewMode";
import store from "./app/stores/store";
import SearchResult from "./app/components/SearchResult";
import SearchBar from "./app/components/SearchBar";
import SettingButton from "./app/components/SettingButton";
import litApi from "./app/litApi";
import LitConstants from "./app/constants/lit";
import uuidv4 from "uuid/v4";

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
  changeView: viewMode => dispatch(changeView(viewMode)),
  mapIsReady: ready => dispatch(mapIsReady(ready)),
  setDeviceId: id => dispatch(setDeviceId(id)),
  setInfo: info => dispatch(setInfo(info)),
  setRegion: region => dispatch(setRegion(region))
});

class ConnectedApp extends React.Component {
  constructor(props) {
    super(props);

    this.goBack = this.goBack.bind(this);
    this.onBackPress = this.onBackPress.bind(this);
    this.onMainScreen = this.onMainScreen.bind(this);
    this.onMapLayout = this.onMapLayout.bind(this);
    this.onMarkerPressed = this.onMarkerPressed.bind(this);
    this.updateDeviceLocation = this.updateDeviceLocation.bind(this);
    this.updateLocations = this.updateLocations.bind(this);
  }

  async _getDeviceLocationAsync() {
    if (Platform.OS === "android" && !Constants.isDevice) {
      return null;
    }
    let { status } = await Permissions.askAsync(Permissions.LOCATION);

    if (status !== "granted") {
      this.setState({
        errorMessage: "Permission denied"
      });
    }

    const location = await Location.getCurrentPositionAsync();

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421
    };
  }

  componentDidMount() {
    BackHandler.addEventListener("hardwareBackPress", this.onBackPress);
  }

  componentWillMount() {
    // Sets a unique id when the app is launched for the first time.
    AsyncStorage.getItem(LitConstants.DEVICE_ID_LABEL)
      .then(id => {
        if (id === null || !id.match(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/)) {
          const new_id = uuidv4();
          AsyncStorage.setItem(LitConstants.DEVICE_ID_LABEL, new_id)
            .then(() => console.log("Device ID: ", new_id))
            .catch(error => console.log("Error saving data:", error));
        } else {
          console.log("Device ID: ", id);
          this.props.setDeviceId(id);
        }
      })
      .catch(error => {
        console.log("Error fetching data:", error);
      });

    // Sets device location
    this.updateDeviceLocation(true);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener("hardwareBackPress", this.onBackPress);
  }

  // TODO: Acording with the documentation, goBack should be async
  // https://facebook.github.io/react-native/docs/backhandler.html#docsNav
  goBack() {
    this.props.changeView(ViewMode.MAP);
  }

  // Handles input when the back button is pressed (Android only)
  onBackPress() {
    if (this.onMainScreen()) {
      BackHandler.exitApp();
    } else {
      this.goBack();
    }
  }

  onMainScreen() {
    return this.props.viewMode === ViewMode.MAP;
  }

  onMapLayout() {
    this.props.mapIsReady(true);
  }

  onMarkerPressed(name) {
    this.props.changeView(ViewMode.INFO);
    this.props.setInfo({ name: name });
  }

  // TODO: The status bar overlaps the app, a horizontal bar must be added.
  render() {
    return (
      <View
        style={{
          flex: 1,
          paddingTop: Constants.statusBarHeight,
          backgroundColor: "#474949"
        }}
      >
        <View style={[styles.row, { marginTop: 20, alignItems: "center" }]}>
          <SettingButton styles={{ marginRight: 15 }} />
          <SearchBar />
        </View>
        <View style={[styles.row, { marginTop: "auto", marginBottom: 15 }]}>
          <SearchResult
            title="Slippery Effin Slope"
            litness="3"
            source={require("./concrete.jpg")}
          />
          <SearchResult
            title="Slippery Effin Slope"
            litness="3"
            source={require("./concrete.jpg")}
          />
          <SearchResult
            title="Slippery Effin Slope"
            litness="3"
            source={require("./concrete.jpg")}
          />
        </View>
        {/* {
                    this.props.viewMode === ViewMode.MAP ?
                        <LitMapView
                            ready={this.props.isMapReady}
                            onLayout={this.onMapLayout}
                            onMarkerPressed={this.onMarkerPressed}
                            places={this.props.places}
                            region={this.props.region}
                            style={{
                                flex: 1
                            }}
                        />
                    :
                        <InfoView info={this.props.info} backCallback={this.goBack} />
                } */}
      </View>
    );
    // if (this.props.viewMode === ViewMode.MAP) {
    //     return <LitMapView
    //         onMarkerPressed={this.onMarkerPressed}
    //         places={this.props.places}
    //         region={this.props.region}
    //     />
    // }
    // else {
    //     return <InfoView name={this.props.info.name} callback={this.goBack}/>
    // }
  }

  updateDeviceLocation(fetchLocations = false) {
    this._getDeviceLocationAsync().then(region => {
      if (region) {
        const previousRegion = this.props.region;
        if (previousRegion !== region) {
          console.log("New region:", region);
          this.props.setRegion(region);
          if (fetchLocations) {
            this.updateLocations();
          }
        }
      }
    });
  }

  updateLocations(radius = 10000) {
    const lat = this.props.region.latitude;
    const lng = this.props.region.longitude;
    litApi
      .getLocations(lat, lng, radius)
      .then(result => console.log(result))
      .catch(error => console.log(error));
  }
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "center"
  },
  col: {
    flexDirection: "column",
    justifyContent: "space-between"
  }
});

// eslint-disable-next-line no-unused-vars
const App = connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedApp);

export default () => (
  <Provider store={store}>
    <App />
  </Provider>
);
