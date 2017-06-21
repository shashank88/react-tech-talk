import React, { Component } from "react";
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";

import "./App.css";
import {
  derive_slug_mapping,
  fetchQuotesForIds,
  fetchQuotes
} from "./utils.js";

const Header = () => {
  return <a href="/"><div className="header">Smarkets-predicts</div></a>;
};

const Footer = () => {
  return <div className="footer">© boring-stuff</div>;
};

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      category_slug: null
    };
  }

  componentDidMount() {
    fetch("/v0/navigation/")
      .then(res => res.json())
      .then(j => derive_slug_mapping(j))
      .then(slug_map => this.setState({ category_slug: slug_map }));
  }

  render() {
    const { category_slug } = this.state;
    // console.log("categories in render:", category_slug);

    const category_items = category_slug
      ? category_slug.map(category => (
          <li key={category.cat} className="side-bar-item">
            <Link to={`/listings/popular${category.slug}/`}>
              {category.cat}
            </Link>
          </li>
        ))
      : <li> Loading .... </li>;

    return (
      <div className="side-bar">
        <ul className="side-bar-list"> {category_items} </ul>
      </div>
    );
  }
}

const MainListingItem = props => {
  return (
    <li key="props.displayText" className="listing-item">
      <div className="listing-header">{props.res.event_name}</div>
      <div className="listing-content">
        {_createPredictionText(props.res)}
      </div>

    </li>
  );
};

function _createPredictionText(resultObj) {
  return `${resultObj.contract_name} has a ${resultObj.win_probability} % chance of winning.`;
}

const ListingView = props => {
  console.log("listingview props=", props);
  const results = props.results;

  const slug = props.slug;
  const main_items = results
    ? results.map(result => (
        <MainListingItem key={result.event_name} res={result} />
      ))
    : <li>Loading data.. </li>;
  return (
    <div className="main-listings">
      <ul className="listing-list"> {main_items}</ul>
    </div>
  );
};

class EventListings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ev_quote: null
    };
  }

  componentWillReceiveProps(props) {
      this.setState({ ev_quote: null })
      fetch("/v0" + this.props.match.url)
      .then(res => res.json())
      .then(resj => resj.event_ids)
      .then(event_ids => fetchQuotesForIds(event_ids))
      .then(event_q => this.setState({ ev_quote: event_q }));
  }

  componentDidMount() {
    fetch("/v0" + this.props.match.url)
      .then(res => res.json())
      .then(resj => resj.event_ids)
      .then(event_ids => fetchQuotesForIds(event_ids))
      .then(event_q => this.setState({ ev_quote: event_q }));
  }

  render() {
    const { ev_quote } = this.state;
    return <ListingView slug={this.props.match.url} results={ev_quote} />;
  }
}

class HomeListings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ev_quote: null
    };
  }

  componentDidMount() {
    fetch("/v0/events/popular/")
      .then(res => res.json())
      .then(pop => fetchQuotes(pop))
      .then(event_q => this.setState({ ev_quote: event_q }));
  }

  render() {
    const { ev_quote } = this.state;
    return <ListingView slug="/" results={ev_quote} />;
  }
}

class RecentlyVisitedListings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visitedLinks: []
    };
  }

  componentDidMount() {
    this.setState({ visitedLinks: [...this.state.visitedLinks, this.props.location.pathname] });
  }
  componentWillReceiveProps(nextProps){
    this.setState({ visitedLinks: [...this.state.visitedLinks, nextProps.location.pathname] });
  }

  render() {
    const elements = this.state.visitedLinks.map(link => (
      <li key={link} className="recently-visited-item">
        <a href="#">{link}</a>
      </li>
    ));

    return (
      <div className="recently-visited">
        Recently-visited
        <ul>
          {elements}
        </ul>
      </div>
    );
  }
}

class App extends Component {
  render() {
    return (
      <Router>
        <div className="container">
          <Header />
          <div className="app">
            <SideBar />
            <Route exact path="/" component={HomeListings} />
            <Route path="/listings/*" component={EventListings} />
            <Route path="/" component = {RecentlyVisitedListings}/>
          </div>
          <Footer />
        </div>
      </Router>
    );
  }
}

export default App;
