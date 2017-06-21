export function derive_slug_mapping(nav) {
  return nav.root.map(ele => {
    return {
      cat: ele,
      slug: nav.nodes[ele].full_slug
    };
  });
}

function _normalizePrices(price) {
  if (price["bids"]) {
    return price["bids"][0]["price"] || 0;
  }
  return 0;
}

function _compare_prices(a, b, lp) {
  return _normalizePrices(lp[b]) - _normalizePrices(lp[a]);
}

function _calculateWinProbability(lp, top_q) {
  if (!lp[top_q]['bids']) {
    return -1;  // fe-api doesn't return the price.
  }
  return lp[top_q]["bids"][0]["price"] / 100
}

function _fetch_event_prediction(event_id) {
  const event_url = `/v0/events/id/${event_id}/`;
  const event_live_url = `/v0/events/ids/${event_id}/live/`;

  let event_data_promise = fetch(event_url).then(res => res.json()).then(j => {
    return {
      name: j.event.name,
      primary_cg: j.event.primary_contract_group_id,
      primary_contracts: j.event.primary_contracts_ids,
      contracts: j.contracts
    };
  });

  let live_promise = fetch(event_live_url).then(res => res.json()).then(jj => {
    return jj["quotes"];
  });
  return Promise.all([event_data_promise, live_promise]).then(([evd, lp]) => {
    let relevant_quotes = evd.primary_contracts.filter(ele => {
      return Object.keys(lp).includes(ele);
    });
    const sorted_quotes = relevant_quotes.sort((a, b) =>
      _compare_prices(a, b, lp)
    );
    const top_q = sorted_quotes[0];
    
    const out_data = {
      contract_name: evd["contracts"][top_q]["name"],
      win_probability: _calculateWinProbability(lp, top_q),
      event_name: evd.name,
    }
    return out_data;
  });
}

export function fetchQuotesForIds(eventIds) {
  return Promise.all(eventIds.map(_fetch_event_prediction)).then(
    data_outputs => data_outputs
  );
}

export function fetchQuotes(popular_events) {
  const eventIdsToFetch = popular_events.results.map(event => event.id);
  return fetchQuotesForIds(eventIdsToFetch);
}