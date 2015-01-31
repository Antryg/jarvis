
var MagnetList = React.createClass({
    getInitialState : function() {
        return {items : []};
    },
    componentDidMount: function() {

        var self = this;

        $.ajax({
            url  : "/magnetManagement/get"
        }).done(function(rspData) {
            if( rspData.status === 'ok' ) {
                self.setState({items: rspData.data});
            } else {
                showAlert('#errorBox', 'alert', 'Something went wrong');
            }
        }).fail(function(rspData) {
            showAlert('#errorBox', 'alert', 'Something went wrong');
        });

//        $.get(this.props.source, function(result) {
//            var lastGist = result[0];
//            if (this.isMounted()) {
//                this.setState({
//                    username: lastGist.owner.login,
//                    lastGistUrl: lastGist.html_url
//                });
//            }
//        }.bind(this));

    },
    render: function() {
        var createItem = function(item) {
            return <tr>
                     <td>{item.id}</td>
                     <td>{item.series}</td>
                     <td>{item.episodeNumber}</td>
                   </tr>;
        };
        return <table>
                 <tr>
                   <th>ID</th>
                   <th>Series</th>
                   <th>Episode #</th>
                 </tr>
                 {this.state.items.map(createItem)}
               </table>;
    }
});

React.render(
    <MagnetList />,
    document.getElementById('content')
);