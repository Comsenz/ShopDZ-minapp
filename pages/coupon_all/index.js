// pages/coupon/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabIndex: 1,
    list: [],
    is_display:false,
    total:0,
    is_msg_true:false,
    msg:null,
    is_true: false,
    rpacket_t_id:null,
  },
  //获取用户积分，优惠券
  getList:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/coupon/lists/status/4?key='+key,
      method: 'GET',
      success:function(res){
        if(res.data.code == 0){
          console.log(res.data.data);
          var orderlist = res.data.data.list;
          var total = res.data.data.points;
          self.setData({
            list: orderlist,
            total: total,
          });
        }
      }
    })
  },
  add_coupon:function(e){
    var self = this;
    var key = wx.getStorageSync('key');
    var rpacket_t_id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '是否确认领取？',
      cancelText: "取消", //默认是“取消”
      confirmText: "确定", //默认是“确定”
      success(res) {
        if (res.cancel) {
          console.log('隐藏');
        } else {
          wx.request({
            url: curl + 'api.php/coupon/coupon_insert/rpacket_t_id/' + rpacket_t_id + '?key=' + key,
            method: 'GET',
            success: function (res) {
              console.log(res);
              self.setData({
                is_display: false,
              })
              if (res.data.code == 0) {
                var num = res.data.data;
                wx.showToast({
                  title: '领取成功，该优惠券已领取' + num + '张。',
                  icon: 'none',
                  duration: 2000
                });
                self.getList();
              } else if (res.data.code == 1) {
                var msg = res.data.msg;
                wx.showToast({
                  title: msg,
                  icon: 'none',
                  duration: 2000
                })
                self.getList();
              } else {
                wx.showToast({
                  title: '领取成功，您已领完所有优惠券。',
                  icon: 'none',
                  duration: 2000
                })
                self.getList();
              }
            }
          })
        }
      }
    })
    
  },

  cancel:function(){
    var self = this;
    self.setData({
      is_display:false,
      rpacket_t_id:null,
    });
  },
  exchange:function(e){
    var self = this;
    var rpacket_t_id = e.currentTarget.dataset.id;
    self.setData({
      rpacket_t_id: rpacket_t_id,
      is_display:true,
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getList()
  },
  //点击随便逛逛返回首页
  jump:function(){
    wx.switchTab({
      url: '../index/index',
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})