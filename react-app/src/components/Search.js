import React from 'react';

class Search extends React.Component{
  constructor(props) {
    super(props)
    this.submit = this.submit.bind(this)
    this.change = this.change.bind(this)
  }
  submit(e) {
    this.props.onSearch(this.props.keyword)
    e.preventDefault()
    return false
  }
  change(e) {
    this.props.onUpdateKeyword(e.target.value)
    e.preventDefault()
    return false
  }
  render() {
    return (
      <div className="search">
        <form onSubmit={this.submit}>
          <input type="text" onChange={this.change} value={this.props.keyword} />
          <input type="submit" value="search" />
        </form>
        <div>
          {this.props.results.map((o, i) => (
            <div key={i}>- <a href={"?user=" + o.user + "&id=" + o.id} data-jump={o.id}>{o.user}/{o.id}</a>:{o.lineNo} {o.text}<a href={"?user=" + o.user + "&id=" + o.id} data-id={o.id}>*</a></div>
          ))}
        </div>
      </div>
    )
  }
}

export default Search
