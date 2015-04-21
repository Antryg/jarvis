
var TvList = React.createClass({
    getInitialState: function () {
        return {items: []};
    },
    componentDidMount: function () {
        this.reload();
    },
    reload: function() {

        var self = this;

        $.ajax({
            url: "/magnetManagement/tv"
        }).done(function (rspData) {
            if (rspData.status === 'ok') {
                self.setState({items: rspData.data});
            } else {
                showAlert('#errorBox', 'alert', 'Something went wrong');
            }
        }).fail(function (rspData) {
            showAlert('#errorBox', 'alert', 'Something went wrong');
        });

    },
    render: function () {
        var self = this;
        var createItem = function (item) {
            return <tr>
                <td>{item.desc}</td>
                <td>{self.colRenderer.watching(self, item)}</td>
                <td>{item.id}</td>
                <td>{item.alias}</td>
            </tr>;
        };
        return <table>
            <tr>
                <th>Series</th>
                <th>Watching</th>
                <th>Id</th>
                <th>Alias-Id</th>
            </tr>
            {this.state.items.map(createItem)}
        </table>;
    },

    colRenderer: {
        watching: function(self, item) {
            if (item.watching) {
                return <div className="switch tiny round" onClick={self.triggerWatch.bind(self, item)}>
                    <input id={"queue_" + item._id} checked type="checkbox" />
                    <label htmlFor={"queue_" + item._id}></label>
                </div>;
            } else {
                return <div className="switch tiny round" onClick={self.triggerWatch.bind(self, item)}>
                    <input disabled id={"queue_" + item._id} type="checkbox" />
                    <label htmlFor={"queue_" + item._id}></label>
                </div>;
            }
        }
    },

    triggerWatch: function(item) {

        var self = this;

        $.ajax({
            url  : "/magnetManagement/tv/watch",
            type : 'POST',
            data : {
                _id      : item._id,
                watching : !item.watching
            }
        }).done(function(rspData) {
            if( rspData.status === 'ok' ) {
                showAlert('#errorBox', 'success', 'Action successful');
                self.reload();
            } else {
                showAlert('#errorBox', 'alert', 'Something went wrong');
            }
        }).fail(function(rspData) {
            showAlert('#errorBox', 'alert', 'Something went wrong');
        });

    }
});

React.render(
    <TvList />,
    document.getElementById('tvcontent')
);