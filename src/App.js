import React, { Component } from 'react'
import SimpleStorageContract from '../build/contracts/SimpleStorage.json'
import getWeb3 from './utils/getWeb3'
import ipfs from './ipfs'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      ipfsHash: '',
      web3: null,
      buffer: null,
      account: null,
	  url: '', 
	  durl: 'https://ipfs.io/ipfs/QmexhJpcnEUEKKjrVsowZkfL37QqziD2usb5jyEyhxJY7q',
	  dbuffer: null,
	  data: []
    }
    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }
  
  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  instantiateContract() {


    const contract = require('truffle-contract')
    const simpleStorage = contract(SimpleStorageContract)
    simpleStorage.setProvider(this.state.web3.currentProvider)
	
	
	
    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      simpleStorage.deployed().then((instance) => {
        this.simpleStorageInstance = instance
        this.setState({ account: accounts[0] })
        // Get the value from the contract to prove it worked.
		console.log("this shit", this.simpleStorageInstance.get.call(accounts[0]))
        return this.simpleStorageInstance.get.call(accounts[0])
      }).then((ipfsHash) => {
        // Update state with the result.
		console.log({ipfsHash})
		console.log({"url ": "`https://ipfs.io/ipfs/"+ipfsHash})
		var durl = "https://ipfs.io/ipfs/"+ipfsHash
		this.setState({durl: durl})
		console.log({durl})
        return this.setState({ ipfsHash })
      })
    })
  }
 
  
  captureFile(event) {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  onSubmit(event) {
    event.preventDefault()
    ipfs.files.add(this.state.buffer, (error, result) => {
      if(error) {
        console.error(error)
        return
      }
	  console.log("new image hash: ", result[0].hash)
	  console.log("new image url: ", "(`https://ipfs.io/ipfs/"+result[0].hash)
	  //Uncomment the line below to add/reset database
	  // once uncommented upload db.json and comment again to continue talking to the blockchain
	  //this.setState({durl: "https://ipfs.io/ipfs/"+result[0].hash})
	  var acc =  this.state.account;
	  //var dbuffer = null;
		fetch(this.state.durl)
		.then(function(response) {
			console.log(response);
			return response.json();
		})
		.then(function(myJson) {
			console.log("JDB: ", myJson)
			console.log(JSON.stringify(myJson.articles));
			//figure out this account shit
			//var acc = () => {return this.state.account; }
			console.log(acc)
			myJson.articles.push({"url": "https://ipfs.io/ipfs/"+result[0].hash, "poster": acc});
			console.log(JSON.stringify(myJson.articles[1]));
			console.log(JSON.stringify(myJson.articles));
			//dbuffer = myJson;
			this.setState({dbuffer: myJson});
			console.log("done")
			console.log(this.state.dbuffer)
		}.bind(this))
		.then(function (){
			//add json to dbuffer....i think done
			ipfs.files.add(Buffer.from(JSON.stringify(this.state.dbuffer)), (err, res) => {
				if(err){
					console.log(err)
					return
				}
				console.log("new db hash: ", res[0].hash)
				
				
				this.simpleStorageInstance.set(res[0].hash, { from: this.state.account }).then((r) => {
					console.log('(make this the json hash)previous ifpsHash', res[0].hash)
					console.log('(make this the json URL)previous URL', "https://ipfs.io/ipfs/"+res[0].hash)
					this.setState({url: "https://ipfs.io/ipfs/"+res[0].hash})
					console.log(this.state.url)
					return this.setState({ ipfsHash: res[0].hash })
			  })
			})
		}.bind(this));
      
    })
  }

  
  render() {
	if(this.state.dbuffer){
		console.log("Render", this.state.dbuffer)
		var articles = this.state.dbuffer.articles.map(function(article, key) {
			return <li><img src={article.url} alt="Loading...." height="200" width="200"/></li>
		});
	}
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">Secure Anonymous File Boradcast DApp (IPFS)</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h2>Upload Image</h2>
              <form onSubmit={this.onSubmit} >
                <input type='file' onChange={this.captureFile} />
                <input type='submit' />
              </form>
			  <h1>Available content</h1>
			  <p>Please contribute to the platform by submitting an image to access the service</p>
				<ul>
				{articles}
				</ul>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
