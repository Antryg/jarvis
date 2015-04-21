
var EpisodeList = React.createClass({
    getInitialState: function () {
        return {items: []};
    },
    componentDidMount: function () {
        this.reload();
    },
    reload: function() {

        var self = this;

        $.ajax({
            url: "/magnetManagement/episodes"
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
                <td>{item.series}</td>
                <td>{item.episodeNumber}</td>
                <td>{self.colRenderer.queue(self, item)}</td>
            </tr>;
        };
        return <table>
            <tr>
                <th>Series</th>
                <th>Episode #</th>
                <th>Queued</th>
            </tr>
            {this.state.items.map(createItem)}
        </table>;
    },

    colRenderer: {
        queue: function(self, item) {
            if (item.queue) {
                return <div className="switch tiny round" onClick={self.triggerQueue.bind(self, item)}>
                    <input id={"queue_" + item._id} checked type="checkbox" />
                    <label htmlFor={"queue_" + item._id}></label>
                </div>;
            } else {
                return <div className="switch tiny round" onClick={self.triggerQueue.bind(self, item)}>
                    <input disabled id={"queue_" + item._id} type="checkbox" />
                    <label htmlFor={"queue_" + item._id}></label>
                </div>;
            }
        }
    },

    triggerQueue: function(item) {

        var self = this;

        $.ajax({
            url  : "/magnetManagement/episodes/queue",
            type : 'POST',
            data : {
                _id     : item._id,
                queue  : !item.queue
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
    <EpisodeList />,
    document.getElementById('epcontent')
);