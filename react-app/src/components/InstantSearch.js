import React from 'react';

class InstantSearch extends React.Component{
  render() {
    return (
      <div className="instant-search">
        {Object.keys(this.props.item).map((k, j) => (
          <div className="piece" key={j}>
            <div>Search result of '{k}'</div>
            <div className="pages">
            {this.props.item[k].slice(0,20).map((r, i) => (
              <li key={i}><div><a href={"?user=" + r.user + "&id=" + r.id} data-jump={r.id}>{r.id}</a><a href={"?user=" + r.user + "&id=" + r.id} data-id={r.id}>*</a></div>
                <div>
                  {(() => {if(r.cover) return <img src={r.cover} alt="cover" />})()}
                  {r.text}
                </div>
              </li>
            ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
}
export default InstantSearch
