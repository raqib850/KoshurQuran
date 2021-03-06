import React, { Component } from "react";
import { View, Switch, Linking, ToastAndroid } from "react-native";
import AlbumArt from "./AlbumArt";
import TrackDetails from "./TrackDetails";
import SeekBar from "./SeekBar";
import Controls from "./Controls";
import Video from "react-native-video";
import Loader from "./Loader";
import PBModal from "./PBModal";
import PBText from "./PBText";
import { colors, dimensions } from "src/theme";
import storageService from "src/services/storageService";
import Toast from "react-native-easy-toast";
import AppData from "src/services/appData";

export default class Player extends Component {
  constructor(props) {
    super(props);

    this.state = {
      paused: false,
      totalLength: 1,
      currentPosition: 0,
      selectedTrack: 0,
      repeatOn: false,
      shuffleOn: false,
      bookmarkedTrack: true,
    };
  }

  componentDidMount() {
    console.log("props in player are-------", this.props);

    if (this.props.position) {
      this.setState({
        currentPosition: this.props.position,
        bookmarkedTrack: true,
      });
    }
    storageService.getItem("repeatVideo").then((repeat) => {
      //   console.log("hey i am checking region", repeat);
      if (repeat) {
        this.setState({
          repeatVideo: repeat === "true" ? true : false,
        });
      } else {
        this.setState({ repeatVideo: false });
      }
    });

    storageService.getItem("playInBackground").then((playInBackground) => {
      //   console.log("hey i am checking region", playInBackground);
      if (playInBackground) {
        this.setState({
          playInBackground: playInBackground === "true" ? true : false,
        });
      } else {
        this.setState({
          playInBackground: false,
        });
      }
    });
  }

  setDuration = (data) => {
    // console.log("Total length", data.duration);

    this.setState({
      totalLength: Math.floor(data.duration),
      loading: false,
    });

    //if bookmarked item and seeked to bookmarked location
    if (this.props.position && this.state.bookmarkedTrack) {
      this.seek(this.props.position);
    }
  };

  setTime = (data) => {
    //console.log(data);
    this.setState({
      currentPosition: Math.floor(data.currentTime),
    });
  };

  seek = (time) => {
    console.log("Seeeeekkkkkk data ------", time);
    time = Math.round(time);
    this.refs.audioElement && this.refs.audioElement.seek(time);
    this.setState({
      currentPosition: time,
      paused: false,
      loading: true,
    });
  };

  onBack = () => {
    if (this.state.currentPosition < 10 && this.state.selectedTrack > 0) {
      this.refs.audioElement && this.refs.audioElement.seek(0);
      this.setState({ isChanging: true });
      setTimeout(
        () =>
          this.setState({
            currentPosition: 0,
            paused: false,
            totalLength: 1,
            isChanging: false,
            selectedTrack: this.state.selectedTrack - 1,
          }),
        0
      );
    } else {
      this.refs.audioElement.seek(0);
      this.setState({
        currentPosition: 0,
      });
    }
  };

  onForward = () => {
    this.setState({ bookmarkedTrack: false });
    if (this.state.selectedTrack < this.props.tracks.length - 1) {
      this.refs.audioElement && this.refs.audioElement.seek(0);
      this.setState({ isChanging: true });
      setTimeout(
        () =>
          this.setState({
            currentPosition: 0,
            totalLength: 1,
            paused: false,
            isChanging: false,
            selectedTrack: this.state.selectedTrack + 1,
          }),
        0
      );
    }
  };

  loadStart = () => {
    if (this.props.position) {
      this.setState({ currentPosition: this.props.position });
    }
    this.setState({ loading: true });
  };

  customize = () => {};

  renderMoreInforModal = () => {
    return (
      <PBModal
        // showModal={true}
        showModal={this.state.showMoreModal}
        modalHeight={dimensions.vh * 30}
        titleText="Customize your listening"
        //   showButton1={true}
        //   button1Text="Customize"
        //   button1Press={this.customize}
        showButton2={true}
        button2Text="Okay"
        button2Press={() => {
          this.setState({
            showMoreModal: false,
          });
        }}
        onBackButtonPress={() => {
          this.setState({
            showMoreModal: false,
          });
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 12,
            justifyContent: "space-between",
          }}
        >
          <PBText>Repeat</PBText>
          <Switch
            value={this.state.repeatVideo}
            trackColor={{
              false: "rgba(204, 204, 204, 0.6)",
              true: colors.thirdColor,
            }}
            onValueChange={this.changeRepeat}
            thumbColor={this.state.setForEveryday ? "#FF5C60" : "#ccc"}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 12,
            justifyContent: "space-between",
          }}
        >
          <PBText>Play in background</PBText>
          <Switch
            value={this.state.playInBackground}
            trackColor={{
              false: "rgba(204, 204, 204, 0.6)",
              true: colors.thirdColor,
            }}
            onValueChange={this.changePlayInBackground}
            thumbColor={this.state.setForEveryday ? "#FF5C60" : "#ccc"}
          />
        </View>
      </PBModal>
    );
  };

  changeRepeat = (val) => {
    console.warn(val);
    storageService.setItem("repeatVideo", JSON.stringify(val));
    this.setState({
      repeatVideo: !this.state.repeatVideo,
    });
  };

  changePlayInBackground = (val) => {
    storageService.setItem("playInBackground", JSON.stringify(val));
    this.setState({
      playInBackground: !this.state.playInBackground,
    });
  };

  downloadSurah = (surahLink) => {
    console.log(surahLink);
    Linking.openURL(surahLink);
  };

  videoError = () => {
    console.warn("Failed");
    this.setState({ loading: false });
  };

  onBuffer = () => {
    this.setState({ loading: false });
  };

  onEnd = () => {};

  bookmark = (surah) => {
    let surahName = surah.title;
    let data = [];

    storageService.getItem("bookmarks").then((bookmarks) => {
      let parsedData = JSON.parse(bookmarks);

      if (bookmarks && bookmarks.length > 0) {
        data = [...parsedData];
        data.push({
          id: surah.id,
          surah: surah,
          position: this.state.currentPosition,
        });
        if (storageService.setItem("bookmarks", JSON.stringify(data))) {
          this.refs.toast.show("Bookmark added!");
        }
      } else {
        data = [
          {
            id: surah.id,
            surah: surah,
            position: this.state.currentPosition,
          },
        ];
        if (storageService.setItem("bookmarks", JSON.stringify(data))) {
          this.refs.toast.show("Bookmark added!");
        }
      }

      // storageService.removeItem("bookmarks");
    });
  };

  render() {
    const track = this.props.tracks[this.state.selectedTrack];
    console.log(
      "Track to play is-----",
      AppData.BASE_URL_AUDIO + track.PostAudio
    );
    const video = this.state.isChanging ? null : (
      <Video
        // source={{ uri: AppData.BASE_URL_AUDIO + track.PostAudio }} // Can be a URL or a local file.
        source={{ uri: "https://file-examples.com/storage/fe5bae0c1d6245d82e95d0f/2017/11/file_example_MP3_700KB.mp3" }} // Can be a URL or a local file.
        ref="audioElement"
        paused={this.state.paused} // Pauses playback entirely.
        resizeMode="cover" // Fill the whole screen at aspect ratio.
        onLoadStart={this.loadStart} // Callback when video starts to load
        onLoad={this.setDuration.bind(this)} // Callback when video loads
        onProgress={this.setTime.bind(this)} // Callback every ~250ms with currentTime
        onEnd={this.onForward} // Callback when playback finishes
        //  onEnd={this.onEnd} // Callback when playback finishes
        onError={this.videoError} // Callback when video cannot be loaded
        style={styles.audioElement}
        playWhenInactive={true}
        repeat={this.state.repeatVideo} // Repeat forever.
        playInBackground={this.state.playInBackground}
        onSeek={this.onBuffer}
      />
    );

    // console.log("Tracks ", this.props);

    return (
      <View style={styles.container}>
        <AlbumArt url={track.albumArtUrl} />
        <TrackDetails
          title={track.title}
          artist={track.artist}
          audioUrl={track.audioUrl}
          onLeftButtonPress={() => this.bookmark(track)}
          // onLeftButtonPress={(surah) => this.downloadSurah(surah)}
          onRightButtonPress={() => this.setState({ showMoreModal: true })}
        />

        <SeekBar
          onSeek={this.seek.bind(this)}
          trackLength={this.state.totalLength}
          onSlidingStart={() => this.setState({ paused: true })}
          currentPosition={this.state.currentPosition}
        />
        <Controls
          onPressRepeat={() =>
            this.setState({
              repeatOn: !this.state.repeatOn,
            })
          }
          repeatOn={this.state.repeatOn}
          shuffleOn={this.state.shuffleOn}
          forwardDisabled={
            this.state.selectedTrack === this.props.tracks.length - 1
          }
          onPressShuffle={() =>
            this.setState({
              shuffleOn: !this.state.shuffleOn,
            })
          }
          onPressPlay={() => this.setState({ paused: false })}
          onPressPause={() => this.setState({ paused: true })}
          onBack={this.onBack.bind(this)}
          onForward={this.onForward.bind(this)}
          paused={this.state.paused}
        />
        {video}

        {this.renderMoreInforModal()}

        <Loader loading={this.state.loading} />

        <Toast ref="toast" />
      </View>
    );
  }
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "rgb(4,4,4)",
  },
  audioElement: {
    height: 0,
    width: 0,
  },
};
