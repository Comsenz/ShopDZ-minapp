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
    img:[],
  },
  tabFun(e){
    var self = this;
    self.setData({
      tabIndex: e.currentTarget.dataset.index
    })
    console.log(e.currentTarget.dataset.index);
    if (e.currentTarget.dataset.index == 1){
      self.not_used();
    } else if (e.currentTarget.dataset.index == 2){
      self.already_used();
    } else if (e.currentTarget.dataset.index == 3){
      self.failure();
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;
    self.not_used();
    self.shopping();
  },
  //未使用
  not_used:function(){
    var self = this;
    // var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/plugin/index/code/group/action/getGroupSet',
      method:'GET',
      success:function(res){
        if(res.data.code == 0){
          console.log(res);
          var list = res.data.data;
          self.setData({
            img:list,
          });
        }
        
      }
    })
  },
  //已使用
  already_used: function () {
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl + 'api.php/coupon/lists/status/2?key=' + key,
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
  //已失效
  shopping: function () {
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl + 'api.php/plugin/index/code/group/action/grouplist',
      method: 'GET',
      success: function (res) {
        if (res.data.code == 0) {
          var list = res.data.data;
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