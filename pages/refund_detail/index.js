// pages/coupon/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabIndex:1,
    list:[],
    data:[],
    data_list:[],
    type:null,
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;
    var refund_sn = options.refund_sn;
    var type = options.type;
    console.log(options);
    if(type ==1){
      self.not_used(refund_sn);
    }else{
      self.already_used(refund_sn);
    }
    self.setData({
      type:type,
    })
  },
  //未使用
  not_used: function (refund_sn){
    var self = this;
    var key = wx.getStorageSync('key');
    var refund_sn = refund_sn;
    wx.request({
      url: curl + 'api.php/presales/refunddetail?key=' + key + '&refund_sn=' + refund_sn,
      method:'GET',
      success:function(res){
        if(res.data.code == 0){
          console.log(res);
          var list = res.data.data.goodslist;
          var data = res.data.data.refund;
          console.log(data);
          self.setData({
            list:list,
            data:data,
          });
        }
        
      }
    })
  },
  //已使用
  already_used: function (refund_sn) {
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl + 'api.php/presales/returndetail?key=' + key + '&return_sn=' + refund_sn,
      method: 'GET',
      success: function (res) {
        console.log(res);
        if (res.data.code == 0) {
          console.log(res);
          var list = res.data.data;
          self.setData({
            data_list: list,
          });
        }

      }
    })
  },
  //已失效
  failure: function () {
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl + 'api.php/coupon/lists/status/3?key=' + key,
      method: 'GET',
      success: function (res) {
        if (res.data.code == 0) {
          console.log(res);
          var list = res.data.data.list;
          self.setData({
            list: list,
          });
        }

      }
    })
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