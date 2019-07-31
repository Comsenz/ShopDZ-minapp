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
    id:null,
    member_id:null,
  },
  //获取用户所以收藏
  getList:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    // var page = '1';
    wx.request({
      url: curl +'api.php/favorites/getfavorites',
      data:{key:key},
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      method: 'POST',
      success:function(res){
        if(res.data.code == 0){
          var orderlist = res.data.data.list;
          console.log(orderlist);
          self.setData({
            list: orderlist,
          });
        }
      }
    })
  },
  //显示删除提示框，保存数据
  is_display:function(e){
    var slef = this;
    var id = e.currentTarget.dataset.id;
    var member_id = e.currentTarget.dataset.userid;
    slef.setData({
      id:id,
      member_id:member_id,
      is_display:true,
    });
  },
  //隐藏删除提示框，清除保存数据
  cancel:function(){
    var slef = this;
    slef.setData({
      id: null,
      member_id: null,
      is_display:false,
    });
  },
  //删除收藏
  addressDel:function(e){
    var slef = this;
    var key = wx.getStorageSync('key');
    console.log(e);
    var fav_id = e.currentTarget.dataset.id;
    var member_id = e.currentTarget.dataset.userid;
    var data = {
      fav_id: fav_id,
      member_id: member_id,
      key: key,
    }
    wx.showModal({
      title: '要删除商品收藏？',
      cancelText: "取消", //默认是“取消”
      confirmText: "确定", //默认是“确定”
      success(res) {
        if (res.cancel) {
          console.log('隐藏');
        }else{
          wx.request({
            url: curl + 'api.php/favorites/delfavorites',
            data: data,
            header: {
              'content-type': 'application/x-www-form-urlencoded' // 默认值
            },
            method: 'POST',
            success: function (res) {
              slef.setData({
                id: null,
                member_id: null,
                is_display: false,
              })
              slef.getList();
            }
          })
        }
      }
    })
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